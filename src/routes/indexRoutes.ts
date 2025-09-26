import express from "express";
import { index } from "../controllers";
import { createVisit } from "../controllers/visitController";
import userRoutes from "./userRoutes";
import { Request, Response } from "express";
import adminRoutes from "./adminRoutes";
import productRoutes from "./productRoutes";

const indexRoutes = express.Router();
indexRoutes.get("/", index);
// Endpoint to record visits (called by client-side when homepage loads)
indexRoutes.post("/visits", createVisit);
indexRoutes.use("/user", userRoutes);
indexRoutes.use("/admin", adminRoutes);
indexRoutes.use("/products", productRoutes);

export default indexRoutes;
