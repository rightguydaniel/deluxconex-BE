import { Request, Response } from "express";
import Orders, { OrderStatus } from "../../models/orders";
import Invoices, { InvoiceStatus } from "../../models/invoices";
import { Op } from "sequelize";

export const getQuickStats = async (req: Request, res: Response) => {
  try {
    // Orders grouped by status
    const statuses = Object.values(OrderStatus) as string[];
    const orderCounts: Record<string, number> = {};
    for (const s of statuses) {
      orderCounts[s] = await Orders.count({ where: { status: s } as any });
    }

    // Invoices grouped by status
    const invoiceStatuses = Object.values(InvoiceStatus) as string[];
    const invoiceCounts: Record<string, number> = {};
    for (const s of invoiceStatuses) {
      invoiceCounts[s] = await Invoices.count({ where: { status: s } as any });
    }

    return res
      .status(200)
      .json({ status: "success", data: { orderCounts, invoiceCounts } });
  } catch (error) {
    console.error("Error fetching quick stats", error);
    return res
      .status(500)
      .json({
        status: "error",
        message: "Unable to fetch quick stats",
        details: error instanceof Error ? error.message : error,
      });
  }
};

export default getQuickStats;
