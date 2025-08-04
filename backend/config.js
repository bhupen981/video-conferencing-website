require("dotenv").config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || "default_jwt_secret",
  port: process.env.PORT || 4000,
};
