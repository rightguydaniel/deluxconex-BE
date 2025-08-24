// checkoutController.ts
import { Request, Response } from "express";
import {
  Client,
  Environment,
  LogLevel,
  OrdersController,
  ApiError,
  CheckoutPaymentIntent,
} from "@paypal/paypal-server-sdk";
import sendResponse from "../utils/sendResponse";
import Orders from "../models/orders";
import Invoices, { InvoiceStatus } from "../models/invoices";
import dotenv from "dotenv";
import { v4 } from "uuid";

dotenv.config();

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId:
      PAYPAL_CLIENT_ID ||
      (() => {
        throw new Error("PAYPAL_CLIENT_ID is not defined");
      })(),
    oAuthClientSecret:
      PAYPAL_CLIENT_SECRET ||
      (() => {
        throw new Error("PAYPAL_CLIENT_SECRET is not defined");
      })(),
  },
  timeout: 0,
  environment: Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: { logBody: true },
    logResponse: { logHeaders: true },
  },
});

const paypalOrdersController = new OrdersController(paypalClient);

export const createCheckout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // Assuming you have authentication middleware
    const { cart } = req.body;

    if (!userId) {
      return sendResponse(
        res,
        401,
        "Authentication required",
        null,
        "User not authenticated"
      );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      return sendResponse(
        res,
        400,
        "Cart is empty",
        null,
        "Cannot checkout with empty cart"
      );
    }

    // Create order in database
    const orderId = v4();
    const order: any = await Orders.create({
      id: orderId,
      userId,
      items: cart.items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        price: item.itemPrice,
        quantity: item.quantity,
        dimension: item.selectedDimension?.dimension,
        deliveryMethod: item.selectedDelivery?.method,
        deliveryPrice: item.selectedDelivery?.price || 0,
        image: item.image,
      })),
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      tax: cart.tax,
      total: cart.total,
      status: "pending",
      shippingAddress: req.body.shippingAddress || {},
      paymentMethod: "card",
      paymentStatus: "pending",
    });

    // Generate invoice number (you might want a more sophisticated system)
    const invoiceCount = await Invoices.count();
    const invoiceNumber = `INV-${Date.now()})`;

    // Create invoice
    const invoice: any = await Invoices.create({
      id: v4(),
      orderId: orderId,
      userId,
      invoiceNumber,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: InvoiceStatus.DRAFT,
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      discount: 0,
      total: cart.total,
      notes: "Thank you for your business!",
      terms: "Payment due within 30 days",
    });

    // Create PayPal order
    const paypalOrder: any = await createPayPalOrder(cart, invoice);

    // Update invoice with PayPal order ID
    await invoice.update({
      status: InvoiceStatus.SENT,
      notes: `PayPal Order ID: ${paypalOrder.id}\n${invoice.notes}`,
    });

    // Find approval link
    const approvalLink = paypalOrder.links?.find(
      (link: any) => link.rel === "approve"
    );

    if (!approvalLink) {
      throw new Error("No approval link found in PayPal response");
    }

    sendResponse(res, 200, "Checkout created successfully", {
      orderId: order.id,
      invoiceId: invoice.id,
      paypalOrderId: paypalOrder.id,
      approvalUrl: approvalLink.href,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    sendResponse(
      res,
      500,
      "Failed to create checkout",
      null,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};

export const handlePaymentSuccess = async (req: Request, res: Response) => {
  try {
    const { orderID, invoiceId } = req.body;

    if (!orderID || !invoiceId) {
      return sendResponse(
        res,
        400,
        "Missing parameters",
        null,
        "Order ID and Invoice ID are required"
      );
    }

    // Capture PayPal payment
    const captureResult = await capturePayPalOrder(orderID);

    if (captureResult.status !== "COMPLETED") {
      throw new Error(`Payment not completed. Status: ${captureResult.status}`);
    }

    // Update invoice and order status
    const invoice: any = await Invoices.findByPk(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await invoice.update({
      status: InvoiceStatus.PAID,
    });

    const order: any = await Orders.findByPk(invoice.orderId);
    if (order) {
      await order.update({
        paymentStatus: "paid",
        status: "processing",
      });
    }

    sendResponse(res, 200, "Payment successful", {
      invoiceId: invoice.id,
      orderId: order?.id,
      paymentStatus: "paid",
    });
  } catch (error) {
    console.error("Payment success error:", error);
    sendResponse(
      res,
      500,
      "Failed to process payment",
      null,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};

export const handlePaymentCancel = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return sendResponse(
        res,
        400,
        "Invoice ID required",
        null,
        "Invoice ID is required"
      );
    }

    const invoice: any = await Invoices.findByPk(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await invoice.update({
      status: InvoiceStatus.CANCELLED,
    });

    const order: any = await Orders.findByPk(invoice.orderId);
    if (order) {
      await order.update({
        paymentStatus: "failed",
        status: "cancelled",
      });
    }

    sendResponse(res, 200, "Payment cancelled", {
      invoiceId: invoice.id,
      orderId: order?.id,
      status: "cancelled",
    });
  } catch (error) {
    console.error("Payment cancel error:", error);
    sendResponse(
      res,
      500,
      "Failed to cancel payment",
      null,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};

// PayPal integration functions
async function createPayPalOrder(cart: any, invoice: any) {
  const items = cart.items.map((item: any) => ({
    name: item.name.substring(0, 127),
    unitAmount: {
      currencyCode: "USD", // This might need to be an enum like CurrencyCode.Usd
      value: item.itemPrice.toFixed(2),
    },
    quantity: item.quantity.toString(),
    description: item.selectedDimension?.dimension
      ? `Dimension: ${item.selectedDimension.dimension}`
      : undefined,
    sku: item.productId,
  }));

  const collect = {
    body: {
      intent: CheckoutPaymentIntent.Capture, // Use the enum if available
      purchaseUnits: [
        {
          referenceId: invoice.invoiceNumber,
          invoiceId: invoice.invoiceNumber,
          amount: {
            currencyCode: "USD", // This might need to be an enum
            value: cart.total.toFixed(2),
            breakdown: {
              itemTotal: {
                currencyCode: "USD", // This might need to be an enum
                value: cart.subtotal.toFixed(2),
              },
              shipping: {
                currencyCode: "USD", // This might need to be an enum
                value: cart.shipping.toFixed(2),
              },
              taxTotal: {
                currencyCode: "USD", // This might need to be an enum
                value: cart.tax.toFixed(2),
              },
            },
          },
          items: items,
          description: `Invoice #${invoice.invoiceNumber}`,
        },
      ],
      paymentSource: {
        card: {
          experienceContext: {
            paymentMethodPreference: "IMMEDIATE_PAYMENT_REQUIRED",
            // paymentMethod: "CARD",
            brandName: "Deluxconex",
            locale: "en-US",
            landingPage: "BILLING",
            userAction: "PAY_NOW",
            shippingPreference: "NO_SHIPPING",
            returnUrl: `${process.env.APP_URL}/checkout/success?invoiceId=${invoice.id}`,
            cancelUrl: `${process.env.APP_URL}/checkout/cancel?invoiceId=${invoice.id}`,
            paymentMethod: {
              payeePreferred: "IMMEDIATE_PAYMENT_REQUIRED",
            },
          },
        },
      },
    },
    prefer: "return=minimal",
  };

  try {
    const { body, ...httpResponse } =
      await paypalOrdersController.createOrder(collect);
    return JSON.parse(
      typeof body === "string"
        ? body
        : body instanceof Blob
          ? await body.text()
          : ""
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`PayPal error: ${error.message}`);
    }
    throw error;
  }
}

async function capturePayPalOrder(orderID: string) {
  const collect = {
    id: orderID,
    prefer: "return=representation",
  };

  try {
    const { body, ...httpResponse } =
      await paypalOrdersController.captureOrder(collect);
    const result = JSON.parse(
      typeof body === "string"
        ? body
        : body instanceof Blob
          ? await body.text()
          : ""
    );
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`PayPal capture error: ${error.message}`);
    }
    throw error;
  }
}
