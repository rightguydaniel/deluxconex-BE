"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Users = exports.UsersRole = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../configs/database/database");
var UsersRole;
(function (UsersRole) {
    UsersRole["USER"] = "user";
    UsersRole["ADMIN"] = "admin";
})(UsersRole || (exports.UsersRole = UsersRole = {}));
class Users extends sequelize_1.Model {
}
exports.Users = Users;
Users.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        unique: true,
    },
    full_name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    user_name: {
        type: sequelize_1.DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM,
        values: Object.values(UsersRole),
        allowNull: false,
    },
    blocked_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    deleted_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
}, {
    sequelize: database_1.database,
    tableName: "Users",
    timestamps: true,
});
exports.default = Users;
