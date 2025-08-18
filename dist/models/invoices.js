"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoices = exports.InvoiceStatus = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../configs/database/database");
const users_1 = require("./users");
const orders_1 = require("./orders");
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "draft";
    InvoiceStatus["SENT"] = "sent";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["OVERDUE"] = "overdue";
    InvoiceStatus["CANCELLED"] = "cancelled";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
class Invoices extends sequelize_1.Model {
}
exports.Invoices = Invoices;
Invoices.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        unique: true,
    },
    orderId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: orders_1.Orders,
            key: "id",
        },
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: users_1.Users,
            key: "id",
        },
    },
    invoiceNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    issueDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    dueDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM,
        values: Object.values(InvoiceStatus),
        defaultValue: InvoiceStatus.DRAFT,
    },
    subtotal: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    tax: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    shipping: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    discount: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
    },
    total: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    terms: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.database,
    tableName: "Invoices",
    timestamps: true,
});
exports.default = Invoices;
