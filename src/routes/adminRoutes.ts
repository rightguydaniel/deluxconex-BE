import express from "express";
import { upload } from "../configs/upload";
import { createProduct } from "../controllers/admin/createProduct";
import { editProduct } from "../controllers/admin/editProduct";
import { deleteProduct } from "../controllers/admin/deleteProduct";
import {
  getProductById,
  getProducts,
  getProductsByCategory,
  searchProducts,
} from "../controllers/admin/getProduct";

const adminRoutes = express.Router();
adminRoutes.post("/products", upload.any(), createProduct);
adminRoutes.put("/products/:id", upload.any(), editProduct);
adminRoutes.delete("/products/:id", deleteProduct);
adminRoutes.get("/products", getProducts);

// Get product by ID
adminRoutes.get("/products/:id", getProductById);

// Get products by category
adminRoutes.get("/products/category/:category", getProductsByCategory);

// Search products
adminRoutes.get("/products/search", searchProducts);

export default adminRoutes;
