import { Request, Response } from "express";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { database } from "../configs/database/database"; // your Sequelize instance
import Invoices, { InvoiceStatus } from "../models/invoices"; // adjust import path/name
import Orders, { OrderStatus } from "../models/orders"; // adjust import path/name
import Addresses from "../models/addresses"; // adjust import path/name
import Carts from "../models/carts"; // adjust import path/name
import sendResponse from "../utils/sendResponse";
import Users from "../models/users";
import { sendEmail } from "../configs/email/emailConfig";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;
const APP_BASE_URL = (process.env.APP_URL || "https://deluxconex.com").replace(
  /\/+$/,
  ""
);

type CartItem = {
  id: string;
  name: string;
  qty: number;
  price: number; // major units (e.g. 19.99)
  sellerAccountId?: string; // Stripe Connect acct id (optional)
  shareAmount?: number; // major units for seller (optional)
};

type CartShape = {
  items: CartItem[];
  currency: string;
  subtotal: number;
  shipping?: number;
  tax?: number;
  total: number;
};

const toMinor = (amountMajor: number) => Math.round(Number(amountMajor) * 100);

/**
 * 1) INITIATE PAYMENT:
 *    - Create Invoice (PENDING) and Order (PENDING)
 *    - Create Stripe Checkout Session
 *    - Return { url } to redirect the user
 */
export const createStripeCheckoutSession = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.id;
    const { cart } = req.body;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const cartRow: any = await Carts.findOne({ where: { userId } });
    if (!cartRow || !cartRow.items?.length) {
      sendResponse(res, 400, "Cart is empty");
      return;
    }
    const user = await Users.findByPk(userId);
    const address: any = await Addresses.findOne({
      where: { userId, isDefault: true },
    });
    if (!address) {
      // mirror PayPal address-required behavior
      sendResponse(res, 200, "address required");
      return;
    }

    const currency = (cart.currency || "usd").toLowerCase();
    const invoiceId = uuidv4();
    const orderId = uuidv4();
    // Create Invoice + Order in a transaction (both PENDING)
    await database.transaction(async (t) => {
      const shippingAddress = {
        street: address?.street,
        city: address?.city,
        state: address?.state,
        postalCode: address?.postalCode,
        country: address?.country,
      };
      await Orders.create(
        {
          id: orderId,
          userId,
          total: cart.total,
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
          shipping: cart.shipping ?? 0,
          tax: cart.tax ?? 0,
          status: OrderStatus.PENDING,
          shippingAddress: shippingAddress,
          paymentMethod: "card",
          paymentStatus: "pending",
        },
        { transaction: t }
      );
      await Invoices.create(
        {
          id: invoiceId,
          userId,
          orderId,
          invoiceNumber: `INV-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: InvoiceStatus.DRAFT,
          subtotal: cart.subtotal,
          tax: cart.tax ?? 0,
          shipping: cart.shipping ?? 0,
          discount: 0,
          total: cart.total,
          notes: "Thank you for your business!",
          terms: "Payment due within 30 days", // like PayPal
        },
        { transaction: t }
      );
    });

    // Build Stripe line items from cart
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.items.map((item: any) => ({
        quantity: item.quantity,
        price_data: {
          currency,
          unit_amount: toMinor(item.itemPrice),
          product_data: { name: item.name },
        },
      }));
    if (cart.shipping && cart.shipping > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toMinor(cart.shipping),
          product_data: { name: "Shipping" },
        },
      });
    }
    if (cart.tax && cart.tax > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toMinor(cart.tax),
          product_data: { name: "Tax" },
        },
      });
    }

    const transferGroup = `order_${orderId}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${APP_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/checkout/cancel`,
      customer_email: user?.email || undefined,
      metadata: {
        userId: String(userId),
        invoiceId,
        orderId,
      },
      payment_intent_data: {
        metadata: {
          userId: String(userId),
          invoiceId,
          orderId,
        },
        transfer_group: transferGroup,
      },
      //   shipping_address_collection: {
      //     allowed_countries: ["US", "GB", "CA", "NG", "IE", "DE", "FR"], // adjust
      //   },
    });
    sendResponse(res, 200, "Stripe checkout session created", {
      url: session.url,
      sessionId: session.id,
      invoiceId,
      orderId,
    });
    return;
  } catch (err: any) {
    console.error("createStripeCheckoutSession error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Stripe session failed",
    });
  }
};

/**
 * 2A) CONFIRMATION VIA SUCCESS PAGE:
 *     - Frontend calls with ?session_id=...
 *     - Verify payment
 *     - Update Invoice -> PAID, Order -> paid
 *     - Delete Cart
 *     - (Optional) Do Connect transfers
 */
export const confirmStripeCheckout = async (req: Request, res: Response) => {
  const sessionId = req.body?.sessionId;
  if (!sessionId) {
    sendResponse(res, 400, "Missing session_id");
    return;
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    if (!session) {
      sendResponse(res, 400, "Session not found");
      return;
    }
    if (session.payment_status !== "paid") {
      // mirror PayPal: show failure state, do not update as paid
      sendResponse(res, 200, "Payment not completed");
      return;
    }

    const pi = session.payment_intent as Stripe.PaymentIntent;
    const { invoiceId, orderId, userId } = {
      ...session.metadata,
      ...pi?.metadata,
    } as any;

    const currency = (pi.currency || session.currency || "usd").toLowerCase();
    const amountMajor = (pi.amount_received || pi.amount) / 100;

    await database.transaction(async (t) => {
      // Update Invoice → PAID
      const invoice: any = await Invoices.findOne({
        where: { id: invoiceId },
        transaction: t,
      });
      if (invoice && invoice.status !== "PAID") {
        await invoice.update(
          { status: InvoiceStatus.PAID, paidAt: new Date() },
          { transaction: t }
        );
      }

      // Update Order → paid, set paymentRef
      const order: any = await Orders.findOne({
        where: { id: orderId },
        transaction: t,
      });
      if (order && order.status !== "paid") {
        await order.update(
          {
            total: amountMajor, // keep final total
            paymentMethod: "stripe",
            paymentStatus: "paid",
            status: OrderStatus.PROCESSING,
            paymentRef: pi.id,
            paymentProvider: "stripe",
          },
          { transaction: t }
        );
      }

      // Delete Cart
      if (userId) await Carts.destroy({ where: { userId }, transaction: t });

      // Optional: Stripe Connect transfers (marketplace)
      const items: CartItem[] = invoice?.meta?.items || [];
      const transferGroup = pi.transfer_group || `order_${orderId}`;
      for (const item of items) {
        if (!item.sellerAccountId || !item.shareAmount) continue;
        await stripe.transfers.create({
          amount: toMinor(item.shareAmount),
          currency,
          destination: item.sellerAccountId,
          transfer_group: transferGroup,
          metadata: { orderId, itemId: item.id, invoiceId: invoiceId || "" },
        });
      }
    });
    sendResponse(res, 200, "Payment successful");
    sendEmail("admin@deluxconex.com", "New Order Received", `
      A new order has been placed.
      
      Order ID: ${orderId}
      Invoice ID: ${invoiceId}
      Amount: ${amountMajor} ${currency.toUpperCase()}
      
      Please check the admin panel for more details.
    `);
    return;
  } catch (err: any) {
    console.error("confirmStripeCheckout error:", err);
    sendResponse(res, 500, "Confirmation failed");
    return;
  }
};

/**
 * 2B) CONFIRMATION VIA WEBHOOK (recommended as source-of-truth):
 *     - Verify signature with raw body
 *     - On payment_intent.succeeded:
 *         * Invoice -> PAID
 *         * Order   -> paid (paymentRef=pi.id)
 *         * Delete Cart
 *         * Optional vendor transfers
 *
 *  IMPORTANT: configure the route with express.raw({ type: 'application/json' })
 */
export const stripeWebhook = async (req: Request, res: Response) => {
  let event: Stripe.Event;

  try {
    const signature = req.headers["stripe-signature"] as string;
    if (!signature || !WEBHOOK_SECRET) {
      return res.status(400).send("Missing webhook secret/signature");
    }
    // use raw body here (see route below)
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      signature,
      WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Stripe webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const { invoiceId, orderId, userId } = pi.metadata || {};
        const currency = (pi.currency || "usd").toLowerCase();
        const amountMajor = (pi.amount_received || pi.amount) / 100;

        await database.transaction(async (t) => {
          // Invoice → PAID (idempotent)
          const inv: any = invoiceId
            ? await Invoices.findOne({
                where: { id: invoiceId },
                transaction: t,
              })
            : null;
          if (inv && inv.status !== "PAID") {
            await inv.update(
              { status: "PAID", paidAt: new Date() },
              { transaction: t }
            );
          }

          // Order → paid (idempotent)
          const ord: any = orderId
            ? await Orders.findOne({ where: { id: orderId }, transaction: t })
            : null;
          if (ord && ord.status !== "paid") {
            await ord.update(
              {
                status: OrderStatus.PROCESSING,
                total: amountMajor,
                currency,
                paymentProvider: "stripe",
                paymentRef: pi.id,
                paymentStatus: "paid",
              },
              { transaction: t }
            );
          }

          // Delete Cart
          if (userId)
            await Carts.destroy({ where: { userId }, transaction: t });

          // Optional transfers
          const items: CartItem[] = inv?.meta?.items || [];
          const transferGroup =
            pi.transfer_group || `order_${orderId || ord?.id}`;
          for (const item of items) {
            if (!item.sellerAccountId || !item.shareAmount) continue;
            await stripe.transfers.create({
              amount: toMinor(item.shareAmount),
              currency,
              destination: item.sellerAccountId,
              transfer_group: transferGroup,
              metadata: {
                orderId: orderId || ord?.id,
                itemId: item.id,
                invoiceId: invoiceId || "",
              },
            });
          }
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const { invoiceId, orderId } = pi.metadata || {};

        // Mark Invoice failed; Order can remain pending/failed per your PayPal logic
        if (invoiceId) {
          await Invoices.update(
            { status: InvoiceStatus.DRAFT },
            { where: { id: invoiceId } }
          );
        }
        if (orderId) {
          await Orders.update(
            { status: OrderStatus.CANCELLED },
            { where: { id: orderId } }
          );
        }
        break;
      }
      default:
        // ignore others; you can log if needed
        break;
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error("stripeWebhook handler error:", err);
    return res.status(500).send("Webhook handler failed");
  }
};
