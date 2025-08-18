"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orders = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../configs/database/database");
class Orders extends sequelize_1.Model {
}
exports.Orders = Orders;
Orders.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        unique: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: "Users",
            key: "id",
        },
    },
    items: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    subtotal: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    shipping: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    tax: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    total: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("pending", "processing", "shipped", "delivered", "cancelled"),
        defaultValue: "pending",
    },
    shippingAddress: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    paymentStatus: {
        type: sequelize_1.DataTypes.ENUM("pending", "paid", "failed", "refunded"),
        defaultValue: "pending",
    },
    trackingNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: database_1.database,
    tableName: "Orders",
    timestamps: true,
});
exports.default = Orders;
