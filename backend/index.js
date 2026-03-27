const express = require("express");
const db = require("./db");
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
const cors = require("cors");
app.use(cors());
// Authentication routing
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
// Driver routing
const driverRoutes = require("./routes/driver");
app.use("/api/drivers", driverRoutes);
// Upload routing
app.use("/uploads", express.static("uploads"));
// Queue routing
const queueRoutes = require("./routes/queue");
app.use("/api/queue", queueRoutes);
// Payment routing
const paymentRoutes = require("./routes/payment");
app.use("/api/payment", paymentRoutes);
// Test Route
app.get("/", (req, res) => {
  res.send("Keke Park Backend Running");
});
// Test DB Route
app.get("/test-db", (req, res) => {
  db.query("SELECT 1", (err, result) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json({ message: "Database connected", result });
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server Error" });
});
// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
