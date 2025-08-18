require("dotenv").config();

module.exports = {
  development: {
    dialect: `${process.env.DB_TYPE === "postgres" ? "postgres" : "mysql"}`,
    host: `${process.env.DB_HOST}`,
    username: `${process.env.DB_USERNAME}`,
    password: `${process.env.DB_PASSWORD}`,
    database: `${process.env.DB_DATABASE}`,
  },
};
