import { DataTypes, Model } from "sequelize";
import { database } from "../configs/database/database";

export interface VisitsAttributes {
  id?: string;
  path: string;
  ip?: string;
  userAgent?: string;
}

export class Visits extends Model<VisitsAttributes> {}

Visits.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: database,
    tableName: "Visits",
    timestamps: true,
  }
);

export default Visits;
