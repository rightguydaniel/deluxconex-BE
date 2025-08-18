import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Users from "../../models/users";
import {
  generatePasswordResetToken,
  generateToken,
  verifyToken,
} from "../../utils/token";
import { sendEmail } from "../../configs/email/emailConfig";
import sendResponse from "../../utils/sendResponse";

export const requestPasswordReset = async (
  request: Request,
  response: Response
) => {
  try {
    const { email } = request.body;

    // Find user by email
    const user = await Users.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      sendResponse(response, 400, "User not found");
      return;
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = generatePasswordResetToken({ id: user.id });

    // Send reset email
    const resetLink = `${process.env.APP_URL}/reset-password/${resetToken}`;
    await sendEmail(
      email,
      "Password Reset Request",
      `Please click the link to reset your password: ${resetLink}`,
      `<p>Please click the link below to reset your password:</p>
       <a href="${resetLink}">Reset Password</a>
       <p>This link will expire in 1 hour.</p>`
    );
    sendResponse(response, 200, "Password reset email sent");
    return;
  } catch (error: any) {
    console.error("Password reset error:", error.message);
    sendResponse(response, 500, "Internal server error");
    return;
  }
};

// Add this new endpoint to your existing passwordReset.ts
export const verifyResetToken = async (
  request: Request,
  response: Response
) => {
  try {
    const { token } = request.params;

    // Verify token
    const decoded: any = verifyToken(token);
    if (!decoded) {
      return sendResponse(response, 400, "Invalid or expired token");
    }

    // Find user
    const user = await Users.findByPk(decoded.id);
    if (!user) {
      return sendResponse(response, 400, "User not found");
    }

    return sendResponse(response, 200, "Token is valid");
  } catch (error: any) {
    console.error("Token verification error:", error);
    return sendResponse(response, 500, "Internal server error");
  }
};

export const resetPassword = async (request: Request, response: Response) => {
  try {
    const { token, newPassword } = request.body;

    // Verify token
    const decoded: any = verifyToken(token);
    if (!decoded) {
      sendResponse(response, 400, "Invalid or expired token");
      return;
    }

    // Find user
    const user = await Users.findByPk(decoded.id);
    if (!user) {
      sendResponse(response, 400, "User not found");
      return;
    }

    // Hash new password

    // Update password
    await user.update({ password: newPassword });
    sendResponse(response, 200, "Password updated successfully");
    return;
  } catch (error: any) {
    console.error("Password reset error:", error);
    sendResponse(response, 500, "Internal server error");
    return;
  }
};
