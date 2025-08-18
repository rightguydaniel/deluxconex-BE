import express from "express";
import { index } from "../controllers";
import userRoutes from "./userRoutes";

const indexRoutes = express.Router();
indexRoutes.get("/", index);
indexRoutes.use("/user", userRoutes)

export default indexRoutes;
