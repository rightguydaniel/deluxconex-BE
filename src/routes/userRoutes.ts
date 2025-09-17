import express from "express";
import { register } from "../controllers/auth/register";
import { login } from "../controllers/auth/login";
import {
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
} from "../controllers/auth/passwordReset";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController";
import {
  getInvoices,
  getInvoice,
  updateInvoiceStatus,
  sendInvoice,
} from "../controllers/invoiceController";

import { getProfile, updateProfile } from "../controllers/profileController";
import { userAuth } from "../middleware/userAuth";
import {
  createCheckout,
  handlePaymentCancel,
  handlePaymentSuccess,
} from "../controllers/checkoutController";
import {
  confirmStripeCheckout,
  createStripeCheckoutSession,
  stripeWebhook,
} from "../controllers/stripeControllers";
const userRoutes = express.Router();
userRoutes.post("/register", register);
userRoutes.post("/login", login);
userRoutes.post("/password/reset-request", requestPasswordReset);
userRoutes.get("/password/verify-token/:token", verifyResetToken);
userRoutes.post("/password/reset", resetPassword);

// Profile routes
userRoutes.get("/profile", userAuth, getProfile);
userRoutes.put("/profile", userAuth, updateProfile);

// // Address routes
userRoutes.get("/addresses", userAuth, getAddresses);
userRoutes.post("/addresses", userAuth, createAddress);
userRoutes.put("/addresses/:id", userAuth, updateAddress);
userRoutes.delete("/addresses/:id", userAuth, deleteAddress);
userRoutes.patch("/addresses/:id/default", userAuth, setDefaultAddress);

// Cart routes
userRoutes.get("/cart", userAuth, getCart);
userRoutes.post("/cart", userAuth, addToCart);
userRoutes.put("/cart/:productId", userAuth, updateCartItem);
userRoutes.delete("/cart/:productId", userAuth, removeFromCart);
userRoutes.delete("/cart", userAuth, clearCart);

//checkout
userRoutes.post("/checkout", userAuth, createCheckout);
userRoutes.post("/checkout/success", userAuth, handlePaymentSuccess);
userRoutes.post("/checkout/cancel", userAuth, handlePaymentCancel);
userRoutes.post("/checkout/stripe/webhook", userAuth, stripeWebhook);
userRoutes.post(
  "/checkout/stripe/session",
  userAuth,
  createStripeCheckoutSession
);
userRoutes.post("/checkout/stripe/confirm", confirmStripeCheckout);

// Order routes
userRoutes.get("/orders", userAuth, getOrders);
// userRoutes.get("/orders/:id", userAuth, getOrder);
// userRoutes.post("/orders", userAuth, createOrder);

// Invoice routes
userRoutes.get("/invoices", userAuth, getInvoices);
// userRoutes.get("/invoices/:id", userAuth, getInvoice);
// userRoutes.post("/invoices/:id/send", userAuth, sendInvoice);

export default userRoutes;
