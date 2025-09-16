import { Request, Response } from "express";
import { Transaction } from "sequelize";
import { database } from "../../configs/database/database";
import Products from "../../models/products"; // your Sequelize model (default export or adjust import)
import {
  getApiBase,
  parseProductData,
  mergeFilesIntoPayload,
} from "../../utils/uploadImages";

export async function createProduct(req: Request, res: Response) {
  let t: Transaction | null = null;
  try {
    const apiBase = getApiBase(req);
    const payload = parseProductData(req);
    const files = (req.files || []) as Express.Multer.File[];

    mergeFilesIntoPayload(payload, files, apiBase);

    // normalize
    if (!Array.isArray(payload.images)) payload.images = [];
    if (!Array.isArray(payload.dimensions)) payload.dimensions = [];

    t = await database.transaction();

    // Map only your actual DB columns here:
    const created = await Products.create(
      payload,
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    if (t) await t.rollback();
    console.error("createProduct error:", err);
    return res
      .status(400)
      .json({ success: false, message: err.message || "Create failed" });
  }
}
