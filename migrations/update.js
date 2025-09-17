"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Orders", "status", {
      type: Sequelize.STRING,
      defaultValue: "pending",
      allowNull: false,
    });
  },

  async down(queryInterface) {},
};
