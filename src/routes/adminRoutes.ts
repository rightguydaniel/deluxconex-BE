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
import {
  allInvoices,
  updateInvoiceStatus,
} from "../controllers/invoiceController";
import { allOrders, updateOrderStatus } from "../controllers/orderController";
import { getDashboardStats } from "../controllers/admin/getDashboardStats";
import { getQuickStats } from "../controllers/admin/getQuickStats";

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

adminRoutes.get("/invoices", allInvoices);
adminRoutes.patch("/invoices/:id/:status", updateInvoiceStatus);

// Dashboard stats
adminRoutes.get("/dashboard", getDashboardStats);
// Quick stats for orders & invoices
adminRoutes.get("/dashboard/quick-stats", getQuickStats);

adminRoutes.get("/orders", allOrders);
adminRoutes.patch("/order/:id", updateOrderStatus);

export default adminRoutes;
