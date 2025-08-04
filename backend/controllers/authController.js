const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

exports.login = (req, res) => {
  const { username, password } = req.body;

  // Demo: accept any non-empty username and password
  if (username && password) {
    const token = jwt.sign({ username }, jwtSecret, { expiresIn: "1h" });
    return res.json({ token, username });
  }
  res.status(401).json({ message: "Invalid credentials" });
};
