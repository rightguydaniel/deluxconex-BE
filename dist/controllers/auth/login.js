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
exports.login = void 0;
const users_1 = __importDefault(require("../../models/users"));
const token_1 = require("../../utils/token");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const login = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = request.body;
        // Find user by email
        const user = yield users_1.default.findOne({ where: { email: email.toLowerCase() } });
        if (!user) {
            (0, sendResponse_1.default)(response, 400, "Invalid credentials");
            return;
        }
        // Check if user is blocked
        if (user.blocked_at) {
            (0, sendResponse_1.default)(response, 400, "Account is blocked");
            return;
        }
        if (password !== user.password) {
            (0, sendResponse_1.default)(response, 400, "Invalid credentials");
            return;
        }
        // Generate token
        const token = (0, token_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        (0, sendResponse_1.default)(response, 200, "Login successful", {
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
            },
            token,
        });
        return;
    }
    catch (error) {
        console.error("Login error:", error.message);
        (0, sendResponse_1.default)(response, 500, "Internal server error");
        return;
    }
});
exports.login = login;
