import { Request, Response } from "express";
import { database } from "../configs/database/database";

export const index = async (request: Request, response: Response) => {
  try {
    await database.authenticate();
    response.status(200).json({
      status: `success`,
      message: `Welcome to DeluxConex API V1`,
      test: "API is working",
      error: false,
      database: "Connection has been established successfully.",
    });
    return
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
