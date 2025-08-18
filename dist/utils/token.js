"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateRefreshToken = exports.generatePasswordResetToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SECRET_KEY = `${process.env.APP_SECRET}`;
const generateToken = (user) => {
    console.log(SECRET_KEY);
    return jsonwebtoken_1.default.sign(user, SECRET_KEY, { expiresIn: "7d" });
};
exports.generateToken = generateToken;
const generatePasswordResetToken = (user, expiry) => {
    console.log(SECRET_KEY);
    return jsonwebtoken_1.default.sign(user, SECRET_KEY, { expiresIn: "1h" });
};
exports.generatePasswordResetToken = generatePasswordResetToken;
const generateRefreshToken = (user) => {
    return jsonwebtoken_1.default.sign(user, SECRET_KEY, { expiresIn: "365d" });
};
exports.generateRefreshToken = generateRefreshToken;
// Verify token
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, SECRET_KEY);
    }
    catch (error) {
        console.log("Error verifying tokens:", error.message);
        return null;
    }
};
exports.verifyToken = verifyToken;
