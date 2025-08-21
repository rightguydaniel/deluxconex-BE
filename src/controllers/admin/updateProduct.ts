import { Request, Response } from "express";
import Products from "../../models/products";

let memoryProducts: any[] = [];

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const payload = req.body || {};

    if (Products && (Products as any).findByPk) {
      try {
        const row = await (Products as any).findByPk(id);
        if (!row) return res.status(404).json({ message: "Product not found" });
        Object.assign(row, payload);
        await (row as any).save();
        return res.status(200).json(row);
      } catch (e) {}
    }
    const idx = memoryProducts.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ message: "Product not found" });
    memoryProducts[idx] = { ...memoryProducts[idx], ...payload, updatedAt: new Date().toISOString() };
    return res.status(200).json(memoryProducts[idx]);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to update product", error: error?.message || String(error) });
  }
};