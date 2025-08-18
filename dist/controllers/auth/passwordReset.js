"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyResetToken = exports.requestPasswordReset = void 0;
const users_1 = __importDefault(require("../../models/users"));
const token_1 = require("../../utils/token");
const emailConfig_1 = require("../../configs/email/emailConfig");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const requestPasswordReset = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = request.body;
        // Find user by email
        const user = yield users_1.default.findOne({ where: { email: email.toLowerCase() } });
        if (!user) {
            (0, sendResponse_1.default)(response, 400, "User not found");
            return;
        }
        // Generate reset token (expires in 1 hour)
        const resetToken = (0, token_1.generatePasswordResetToken)({ id: user.id });
        // Send reset email
        const resetLink = `${process.env.APP_URL}/reset-password/${resetToken}`;
        yield (0, emailConfig_1.sendEmail)(email, "Password Reset Request", `Please click the link to reset your password: ${resetLink}`, `<p>Please click the link below to reset your password:</p>
       <a href="${resetLink}">Reset Password</a>
       <p>This link will expire in 1 hour.</p>`);
        (0, sendResponse_1.default)(response, 200, "Password reset email sent");
        return;
    }
    catch (error) {
        console.error("Password reset error:", error.message);
        (0, sendResponse_1.default)(response, 500, "Internal server error");
        return;
    }
});
exports.requestPasswordReset = requestPasswordReset;
// Add this new endpoint to your existing passwordReset.ts
const verifyResetToken = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = request.params;
        // Verify token
        const decoded = (0, token_1.verifyToken)(token);
        if (!decoded) {
            return (0, sendResponse_1.default)(response, 400, "Invalid or expired token");
        }
        // Find user
        const user = yield users_1.default.findByPk(decoded.id);
        if (!user) {
            return (0, sendResponse_1.default)(response, 400, "User not found");
        }
        return (0, sendResponse_1.default)(response, 200, "Token is valid");
    }
    catch (error) {
        console.error("Token verification error:", error);
        return (0, sendResponse_1.default)(response, 500, "Internal server error");
    }
});
exports.verifyResetToken = verifyResetToken;
const resetPassword = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword } = request.body;
        // Verify token
        const decoded = (0, token_1.verifyToken)(token);
        if (!decoded) {
            (0, sendResponse_1.default)(response, 400, "Invalid or expired token");
            return;
        }
        // Find user
        const user = yield users_1.default.findByPk(decoded.id);
        if (!user) {
            (0, sendResponse_1.default)(response, 400, "User not found");
            return;
        }
        // Hash new password
        // Update password
        yield user.update({ password: newPassword });
        (0, sendResponse_1.default)(response, 200, "Password updated successfully");
        return;
    }
    catch (error) {
        console.error("Password reset error:", error);
        (0, sendResponse_1.default)(response, 500, "Internal server error");
        return;
    }
});
exports.resetPassword = resetPassword;
