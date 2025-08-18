"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse = (res, statusCode, message, data, errorMessage) => {
    res.status(statusCode).json({
        status: statusCode === 200 ? "success" : "error",
        message,
        error: statusCode === 200 ? false : true,
        data: data || null,
        errorMessage: errorMessage || null,
    });
};
exports.default = sendResponse;
