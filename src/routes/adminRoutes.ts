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
import {
  clearAdminUserCart,
  createAdminUserAddress,
  deleteAdminUserAddress,
  deleteAdminUserPaymentMethod,
  getAdminUser,
  getAdminUserAddresses,
  getAdminUserCart,
  getAdminUserInvoices,
  getAdminUserOrders,
  getAdminUserPaymentMethods,
  listAdminUsers,
  removeAdminUserCartItem,
  setAdminUserDefaultAddress,
  setAdminUserDefaultPaymentMethod,
  toggleAdminUserBlock,
  toggleAdminUserDeletion,
  updateAdminUser,
  updateAdminUserAddress,
  updateAdminUserCartItem,
  updateAdminUserPaymentMethod,
  updateAdminUserRole,
} from "../controllers/admin/userManagement";

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

// User management
adminRoutes.get("/users", listAdminUsers);
adminRoutes.get("/users/:id", getAdminUser);
adminRoutes.put("/users/:id", updateAdminUser);
adminRoutes.patch("/users/:id/role", updateAdminUserRole);
adminRoutes.patch("/users/:id/block", toggleAdminUserBlock);
adminRoutes.patch("/users/:id/delete", toggleAdminUserDeletion);

adminRoutes.get("/users/:id/orders", getAdminUserOrders);
adminRoutes.get("/users/:id/invoices", getAdminUserInvoices);

adminRoutes.get("/users/:id/cart", getAdminUserCart);
adminRoutes.patch("/users/:id/cart/items", updateAdminUserCartItem);
adminRoutes.delete("/users/:id/cart/items", removeAdminUserCartItem);
adminRoutes.delete("/users/:id/cart", clearAdminUserCart);

adminRoutes.get("/users/:id/addresses", getAdminUserAddresses);
adminRoutes.post("/users/:id/addresses", createAdminUserAddress);
adminRoutes.put("/users/:id/addresses/:addressId", updateAdminUserAddress);
adminRoutes.delete("/users/:id/addresses/:addressId", deleteAdminUserAddress);
adminRoutes.patch(
  "/users/:id/addresses/:addressId/default",
  setAdminUserDefaultAddress
);

adminRoutes.get("/users/:id/payment-methods", getAdminUserPaymentMethods);
adminRoutes.put(
  "/users/:id/payment-methods/:paymentMethodId",
  updateAdminUserPaymentMethod
);
adminRoutes.patch(
  "/users/:id/payment-methods/:paymentMethodId/default",
  setAdminUserDefaultPaymentMethod
);
adminRoutes.delete(
  "/users/:id/payment-methods/:paymentMethodId",
  deleteAdminUserPaymentMethod
);

export default adminRoutes;
