"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const register_1 = require("../controllers/auth/register");
const login_1 = require("../controllers/auth/login");
const passwordReset_1 = require("../controllers/auth/passwordReset");
const userRoutes = express_1.default.Router();
userRoutes.post("/register", register_1.register);
userRoutes.post("/login", login_1.login);
userRoutes.post("/password/reset-request", passwordReset_1.requestPasswordReset);
userRoutes.get("/password/verify-token/:token", passwordReset_1.verifyResetToken);
userRoutes.post("/password/reset", passwordReset_1.resetPassword);
exports.default = userRoutes;
