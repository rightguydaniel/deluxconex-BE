import { Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import Products from "../../models/products";

let memoryProducts: any[] = [];

const toNumber = (n: any, d: number) => {
  const x = parseInt(String(n), 10);
  return Number.isFinite(x) && x > 0 ? x : d;
};

export const listProducts = async (req: Request, res: Response) => {
  try {
    const search = (req.query.q || req.query.search || "").toString().trim().toLowerCase();
    const page = toNumber(req.query.page, 1);
    const limit = toNumber(req.query.limit, 10);
    const offset = (page - 1) * limit;

    if (Products && (Products as any).findAndCountAll) {
      try {
        const where: any = {};
        if (search) {
          const like = { [Op.like]: `%${search}%` };
          where[Op.or] = [
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("name")), like),
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("sku")), like),
          ];
        }
        const result = await (Products as any).findAndCountAll({
          where,
          limit,
          offset,
          order: [["createdAt", "DESC"]],
        });
        return res.status(200).json({
          data: result.rows,
          page,
          limit,
          total: result.count,
          totalPages: Math.ceil(result.count / limit) || 1,
        });
      } catch (e) {
        // fall back
      }
    }

    let items = memoryProducts;
    if (search) {
      items = items.filter((p) =>
        (p.name || "").toLowerCase().includes(search) ||
        (p.sku || "").toLowerCase().includes(search)
      );
    }
    const total = items.length;
    const data = items.slice(offset, offset + limit);
    return res.status(200).json({
      data, page, limit, total, totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch products", error: error?.message || String(error) });
  }
};