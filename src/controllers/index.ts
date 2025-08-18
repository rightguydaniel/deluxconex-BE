import { Request, Response } from "express";

export const index = async (request: Request, response: Response) => {
  response.status(200).json({
    status: `success`,
    message: `Welcome to DeluxConex API V1`,
    error: false,
  });
};
