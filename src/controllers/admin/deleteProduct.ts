import { Request, Response } from "express";
import Products from "../../models/products";

let memoryProducts: any[] = [];

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (Products && (Products as any).destroy) {
      try {
        const deleted = await (Products as any).destroy({ where: { id } });
        if (!deleted) return res.status(404).json({ message: "Product not found" });
        return res.status(204).send();
      } catch (e) {}
    }
    const idx = memoryProducts.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ message: "Product not found" });
    memoryProducts.splice(idx, 1);
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to delete product", error: error?.message || String(error) });
  }
};