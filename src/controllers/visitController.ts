import { Request, Response } from "express";
import Visits from "../models/visits";

export const createVisit = async (req: Request, res: Response) => {
  try {
    const { path } = req.body || {};

    const visit = await Visits.create({
      path: path || req.originalUrl || "/",
      ip: req.ip || (req.headers["x-forwarded-for"] as string) || undefined,
      userAgent: req.get("User-Agent") || undefined,
    });

    return res.status(201).json({ status: "success", data: visit });
  } catch (error) {
    console.error("Error recording visit", error);
    return res
      .status(500)
      .json({ status: "error", message: "Unable to record visit" });
  }
};

export default createVisit;
