import { Request, Response } from "express";
import Users from "../../models/users";
import Orders from "../../models/orders";
import Products from "../../models/products";
import Invoices, { InvoiceStatus } from "../../models/invoices";
import Visits from "../../models/visits";
import { Op } from "sequelize";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Total users
    const totalUsers = await Users.count();

    // Total orders
    const totalOrders = await Orders.count();

    // Total revenue - sum of paid orders' total
    const revenueRow: any = await Orders.findAll({
      attributes: [
        [
          // @ts-ignore
          Orders.sequelize!.fn("SUM", Orders.sequelize!.col("total")),
          "totalRevenue",
        ],
      ],
      where: {
        paymentStatus: "paid",
      },
      raw: true,
    });

    const totalRevenue =
      revenueRow && revenueRow[0] && revenueRow[0].totalRevenue
        ? Number(revenueRow[0].totalRevenue)
        : 0;

    // Total products
    const totalProducts = await Products.count();

    // Pending invoices: treat invoices that are not PAID or CANCELLED as pending
    const pendingInvoices = await Invoices.count({
      where: {
        status: {
          [Op.in]: [
            InvoiceStatus.DRAFT,
            InvoiceStatus.SENT,
            InvoiceStatus.OVERDUE,
          ],
        },
      },
    });

    // Total visitors today on the landing page ('/')
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const totalVisitorsToday = await Visits.count({
      where: {
        path: "/",
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      } as unknown as any,
    });

    return res.status(200).json({
      status: "success",
      data: {
        totalUsers,
        totalOrders,
        totalRevenue,
        totalProducts,
        pendingInvoices,
        totalVisitorsToday,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats", error);
    return res
      .status(500)
      .json({
        status: "error",
        message: "Unable to fetch dashboard stats",
        details: error instanceof Error ? error.message : error,
      });
  }
};

export default getDashboardStats;
