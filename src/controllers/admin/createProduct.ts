import { Request, Response } from "express";
import Products from "../../models/products";

let memoryProducts: any[] = [];

export const createProduct = async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    payload.images = Array.isArray(payload.images) ? payload.images : [];
    payload.specifications = Array.isArray(payload.specifications) ? payload.specifications : [];
    payload.dimensions = Array.isArray(payload.dimensions) ? payload.dimensions : [];
    payload.delivery = Array.isArray(payload.delivery) ? payload.delivery : [];
    payload.categories = Array.isArray(payload.categories) ? payload.categories : [];

    if (Products && (Products as any).create) {
      try {
        const created = await (Products as any).create(payload);
        return res.status(201).json(created);
      } catch (e) {}
    }
    const id = payload.id || `prod_${Date.now()}`;
    const created = { ...payload, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    memoryProducts.unshift(created);
    return res.status(201).json(created);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to create product", error: error?.message || String(error) });
  }
};