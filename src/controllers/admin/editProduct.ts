import { Request, Response } from "express";
import { Transaction } from "sequelize";
import { database } from "../../configs/database/database";
import Products from "../../models/products";
import {
  getApiBase,
  parseProductData,
  mergeFilesIntoPayload,
} from "../../utils/uploadImages";

export async function editProduct(req: Request, res: Response) {
  let t: Transaction | null = null;
  try {
    const id = req.params.id;
    if (!id) throw new Error("Missing product id.");

    const apiBase = getApiBase(req);
    const payload = parseProductData(req);
    const files = (req.files || []) as Express.Multer.File[];

    mergeFilesIntoPayload(payload, files, apiBase);

    if (!Array.isArray(payload.images)) payload.images = [];
    if (!Array.isArray(payload.dimensions)) payload.dimensions = [];

    t = await database.transaction();

    const existing = await Products.findByPk(id, { transaction: t });
    if (!existing) throw new Error("Product not found.");

    await existing.update(payload, { transaction: t });

    await t.commit();

    const updated = await Products.findByPk(id); // fresh read (outside tx)
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    if (t) await t.rollback();
    console.error("editProduct error:", err);
    return res
      .status(400)
      .json({ success: false, message: err.message || "Update failed" });
  }
}
