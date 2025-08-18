"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethods = exports.CardType = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../configs/database/database");
const users_1 = require("./users");
var CardType;
(function (CardType) {
    CardType["VISA"] = "visa";
    CardType["MASTERCARD"] = "mastercard";
    CardType["AMEX"] = "amex";
    CardType["DISCOVER"] = "discover";
    CardType["JCB"] = "jcb";
    CardType["DINERS_CLUB"] = "diners_club";
    CardType["OTHER"] = "other";
})(CardType || (exports.CardType = CardType = {}));
class PaymentMethods extends sequelize_1.Model {
}
exports.PaymentMethods = PaymentMethods;
PaymentMethods.init({
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
    isDefault: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    cardType: {
        type: sequelize_1.DataTypes.ENUM,
        values: Object.values(CardType),
        allowNull: false,
    },
    cardholderName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    cardNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    expiryMonth: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 12,
        },
    },
    expiryYear: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: new Date().getFullYear(),
        },
    },
    cvv: {
        type: sequelize_1.DataTypes.STRING(4),
        allowNull: true,
    },
    lastFourDigits: {
        type: sequelize_1.DataTypes.STRING(4),
        allowNull: false,
        validate: {
            len: [4, 4],
        },
    },
    billingAddress: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    // PayPal integration fields
    paypalPaymentMethodId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    paypalCustomerId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    createdAt: "",
    updatedAt: "",
}, {
    sequelize: database_1.database,
    tableName: "PaymentMethods",
    timestamps: true,
});
// Set up associations
PaymentMethods.belongsTo(users_1.Users, { foreignKey: "userId" });
users_1.Users.hasMany(PaymentMethods, { foreignKey: "userId" });
exports.default = PaymentMethods;
