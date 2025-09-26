import { Request, Response } from "express";
import { database } from "../configs/database/database";
import Visits from "../models/visits";

export const index = async (request: Request, response: Response) => {
  try {
    await database.authenticate();

    // Record a visit to the landing page
    try {
      await Visits.create({
        path: "/",
        ip:
          request.ip ||
          (request.headers["x-forwarded-for"] as string) ||
          undefined,
        userAgent: request.get("User-Agent") || undefined,
      });
    } catch (err) {
      // non-fatal - log and continue
      console.warn(
        "Unable to record visit:",
        err instanceof Error ? err.message : err
      );
    }

    response.status(200).json({
      status: `success`,
      message: `Welcome to DeluxConex API V1`,
      test: "API is working",
      error: false,
      database: "Connection has been established successfully.",
    });
    return;
  } catch (error) {
    response.status(500).json({
      status: `error`,
      message: `Welcome to DeluxConex API V1`,
      error: true,
      database: "Unable to connect to the database.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};
