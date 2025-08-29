import { Response } from "express";
import { Orders } from "../models/orders";
import { Carts, CartsAttributes } from "../models/carts";
import { Invoices, InvoiceStatus } from "../models/invoices";
import { Users } from "../models/users";
import sendResponse from "../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";
import { v4 } from "uuid";

export const allOrders = async (req: JwtPayload, res: Response) => {
  try {
    const orders = await Orders.findAll({ order: [["createdAt", "DESC"]] });
    sendResponse(res, 200, "Orders fetched", orders);
    return;
  } catch (error: any) {
    console.log("Error in allOrders", error.message);
    sendResponse(res, 500, "Internal Server Error", null, error.message);
    return;
  }
};

export const getOrders = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const orders = await Orders.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    sendResponse(res, 200, "Orders retrieved successfully", orders);
  } catch (error: any) {
    sendResponse(res, 500, "Error retrieving orders", null, error.message);
  }
};

export const getOrder = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Orders.findOne({ where: { id, userId } });
    if (!order) {
      return sendResponse(res, 404, "Order not found");
    }

    sendResponse(res, 200, "Order retrieved successfully", order);
  } catch (error: any) {
    sendResponse(res, 500, "Error retrieving order", null, error.message);
  }
};

export const createOrder = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body;

    // Get user's cart
    const cart: any = await Carts.findOne({ where: { userId } });
    if (!cart || cart.items.length === 0) {
      return sendResponse(res, 400, "Cart is empty");
    }

    // Create order
    const orderId = v4();
    const order = await Orders.create({
      id: orderId,
      userId,
      items: cart.items,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      tax: cart.tax,
      total: cart.total,
      status: "pending",
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
    });

    // Create invoice
    const invoiceNumber = `INV-${Date.now()}`;
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + 14); // 14 days from now

    const invoice = await Invoices.create({
      id: v4(),
      orderId: orderId,
      userId,
      invoiceNumber,
      issueDate,
      dueDate,
      status: InvoiceStatus.DRAFT,
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      total: cart.total,
      notes: "Thank you for your business!",
      terms: "Payment due within 14 days",
    });

    // Clear cart
    await cart.update({
      items: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
    });

    sendResponse(res, 201, "Order created successfully", { order, invoice });
  } catch (error: any) {
    sendResponse(res, 500, "Error creating order", null, error.message);
  }
};

export const updateOrderStatus = async (req: JwtPayload, res: Response) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, paymentStatus } = req.body;

    const order = await Orders.findByPk(id);
    if (!order) {
      return sendResponse(res, 404, "Order not found");
    }
    if (status) {
      await order.update({ status });
      sendResponse(res, 200, "Order status updated successfully", order);
      return;
    }
    if (trackingNumber) {
      await order.update({ trackingNumber });
      sendResponse(res, 200, "Order status updated successfully", order);
      return;
    }
    if (paymentStatus) {
      await order.update({ paymentStatus });
      sendResponse(res, 200, "Order status updated successfully", order);
      return;
    }
  } catch (error: any) {
    sendResponse(res, 500, "Error updating order status", null, error.message);
    return;
  }
};
