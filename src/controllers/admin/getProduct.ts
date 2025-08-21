import { Request, Response } from "express";
import Products from "../../models/products";

let memoryProducts: any[] = [];

export const getProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (Products && (Products as any).findByPk) {
      try {
        const row = await (Products as any).findByPk(id);
        if (!row) return res.status(404).json({ message: "Product not found" });
        return res.status(200).json(row);
      } catch (e) {}
    }
    const found = memoryProducts.find((p) => p.id === id);
    if (!found) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json(found);
  } catch (error: any) {
    return res
      .status(500)
      .json({
        message: "Failed to get product",
        error: error?.message || String(error),
      });
  }
};
