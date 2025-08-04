const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { port } = require("./config");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Video Conferencing Backend running...");
});

app.listen(port, () => {
  console.log(`Auth server is running on port ${port}`);
});
