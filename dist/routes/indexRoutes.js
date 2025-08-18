"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controllers_1 = require("../controllers");
const userRoutes_1 = __importDefault(require("./userRoutes"));
const indexRoutes = express_1.default.Router();
indexRoutes.get("/", controllers_1.index);
indexRoutes.use("/user", userRoutes_1.default);
exports.default = indexRoutes;
