import express from "express";
import { index } from "../controllers";
import userRoutes from "./userRoutes";
import { Request, Response } from "express";

const indexRoutes = express.Router();
indexRoutes.get("/", index);
indexRoutes.use("/user", userRoutes);
indexRoutes.get("/test", async (request: Request, response: Response) => {
  response.status(200).json({
    status: `success`,
    message: `Testing Deployment`,
    error: false,
  });
});

export default indexRoutes;
