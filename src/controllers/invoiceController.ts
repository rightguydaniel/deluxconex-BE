import { Request, Response } from "express";
import { Invoices, InvoiceStatus } from "../models/invoices";
import { Orders } from "../models/orders";
import sendResponse from "../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";

export const allInvoices = async (req: JwtPayload, res: Response) => {
  try {
    const invoices = await Invoices.findAll({
      order: [["issueDate", "DESC"]],
    });
    sendResponse(res, 200, "All Invoices retrieved successfully", invoices);
    return;
  } catch (error: any) {
    console.log("allInvoices:", error.message);
    sendResponse(
      res,
      500,
      "Error retrieving all invoices",
      null,
      error.message
    );
    return;
  }
};

export const getInvoices = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const invoices = await Invoices.findAll({
      where: { userId },
      order: [["issueDate", "DESC"]],
    });
    sendResponse(res, 200, "Invoices retrieved successfully", invoices);
  } catch (error: any) {
    sendResponse(res, 500, "Error retrieving invoices", null, error.message);
  }
};

export const getInvoice = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const invoice = await Invoices.findOne({
      where: { id, userId },
      include: [
        {
          model: Orders,
          attributes: ["id", "items", "status", "shippingAddress"],
        },
      ],
    });

    if (!invoice) {
      return sendResponse(res, 404, "Invoice not found");
    }

    sendResponse(res, 200, "Invoice retrieved successfully", invoice);
  } catch (error: any) {
    sendResponse(res, 500, "Error retrieving invoice", null, error.message);
  }
};

export const updateInvoiceStatus = async (req: JwtPayload, res: Response) => {
  try {
    const { id, status } = req.params;

    const invoice = await Invoices.findByPk(id);
    if (!invoice) {
      return sendResponse(res, 404, "Invoice not found");
    }

    await invoice.update({ status });
    sendResponse(res, 200, "Invoice status updated successfully", invoice);
  } catch (error: any) {
    sendResponse(
      res,
      500,
      "Error updating invoice status",
      null,
      error.message
    );
  }
};

export const sendInvoice = async (req: JwtPayload, res: Response) => {
  try {
    const { id } = req.params;

    const invoice: any = await Invoices.findByPk(id);
    if (!invoice) {
      return sendResponse(res, 404, "Invoice not found");
    }

    // Update status to sent
    await invoice.update({ status: InvoiceStatus.SENT });

    // Here you would implement actual email sending logic
    console.log(`Sending invoice ${invoice.invoiceNumber} to customer`);

    sendResponse(res, 200, "Invoice sent successfully", invoice);
  } catch (error: any) {
    sendResponse(res, 500, "Error sending invoice", null, error.message);
  }
};
