"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Carts = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../configs/database/database");
const users_1 = require("./users");
class Carts extends sequelize_1.Model {
}
exports.Carts = Carts;
Carts.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        unique: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        unique: true, // One cart per user
        references: {
            model: users_1.Users,
            key: "id",
        },
    },
    items: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    subtotal: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    shipping: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    tax: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    total: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize: database_1.database,
    tableName: "Carts",
    timestamps: true,
    createdAt: false, // We only care about when the cart was updated
});
// Set up associations
Carts.belongsTo(users_1.Users, { foreignKey: "userId" });
users_1.Users.hasOne(Carts, { foreignKey: "userId" });
exports.default = Carts;
