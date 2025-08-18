import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = `${process.env.APP_SECRET}`;

export const generateToken = (user: any) => {
  console.log(SECRET_KEY);
  return jwt.sign(user, SECRET_KEY, { expiresIn: "7d" });
};

export const generatePasswordResetToken = (user: any, expiry?: string) => {
  console.log(SECRET_KEY);
  return jwt.sign(user, SECRET_KEY, { expiresIn: "1h" });
};

export const generateRefreshToken = (user: any) => {
  return jwt.sign(user, SECRET_KEY, { expiresIn: "365d" });
};

// Verify token
export const verifyToken = (token: any) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error: any) {
    console.log("Error verifying tokens:", error.message);
    return null;
  }
};
