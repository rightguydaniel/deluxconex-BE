import express from "express";
import { index } from "../controllers";
import userRoutes from "./userRoutes";
import { Request, Response } from "express";
import adminRoutes from "./adminRoutes";
import productRoutes from "./productRoutes";

const indexRoutes = express.Router();
indexRoutes.get("/", index);
indexRoutes.use("/user", userRoutes);
indexRoutes.use("/admin", adminRoutes);
indexRoutes.use("/products", productRoutes)

export default indexRoutes;
