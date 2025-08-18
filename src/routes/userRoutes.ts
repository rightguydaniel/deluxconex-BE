import express from "express";
import { index } from "../controllers";
import { register } from "../controllers/auth/register";
import { login } from "../controllers/auth/login";
import { requestPasswordReset, resetPassword, verifyResetToken } from "../controllers/auth/passwordReset";

const userRoutes = express.Router();
userRoutes.post("/register", register);
userRoutes.post("/login", login);
userRoutes.post("/password/reset-request", requestPasswordReset);
userRoutes.get("/password/verify-token/:token", verifyResetToken)
userRoutes.post("/password/reset", resetPassword);

export default userRoutes;
