"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.register = void 0;
const users_1 = __importStar(require("../../models/users"));
const emailConfig_1 = require("../../configs/email/emailConfig");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const register = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { full_name, user_name, email, phone, password } = request.body;
        // Check if user already exists
        const existingUser = yield users_1.default.findOne({ where: { email } });
        if (existingUser) {
            (0, sendResponse_1.default)(response, 400, "Email already in use");
            return;
        }
        // Send welcome email
        yield (0, emailConfig_1.sendEmail)(email, "Welcome to Delux", `Hi ${full_name}, welcome to DeluxConex`, `<h1>Welcome ${full_name}</h1><p>Your account has been successfully created.</p>`);
        // Create user
        const user = yield users_1.default.create({
            full_name,
            user_name,
            email: email.toLowerCase(),
            phone,
            password,
            role: users_1.UsersRole.USER,
        });
        (0, sendResponse_1.default)(response, 200, "User created successfully");
        return;
    }
    catch (error) {
        console.error("Registration error:", error.message);
        (0, sendResponse_1.default)(response, 500, "Internal server error");
        return;
    }
});
exports.register = register;
