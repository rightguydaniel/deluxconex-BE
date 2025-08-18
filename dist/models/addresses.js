"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addresses = exports.AddressType = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../configs/database/database");
const users_1 = require("./users");
var AddressType;
(function (AddressType) {
    AddressType["BILLING"] = "billing";
    AddressType["SHIPPING"] = "shipping";
})(AddressType || (exports.AddressType = AddressType = {}));
class Addresses extends sequelize_1.Model {
}
exports.Addresses = Addresses;
Addresses.init({
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
            model: users_1.Users,
            key: "id",
        },
    },
    type: {
        type: sequelize_1.DataTypes.ENUM,
        values: Object.values(AddressType),
        allowNull: false,
    },
    street: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    state: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    postalCode: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    country: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    isDefault: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    additionalInfo: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.database,
    tableName: "Addresses",
    timestamps: true,
});
exports.default = Addresses;
