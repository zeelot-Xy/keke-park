const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const SECRET = "secretkey";

// REGISTER
router.post("/register", async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name, phone, password) VALUES (?, ?, ?)",
      [name, phone, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ message: "User registered successfully" });
      },
    );
  } catch (err) {
    res.status(500).json(err);
  }
});

// LOGIN
router.post("/login", (req, res) => {
  const { phone, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE phone = ?",
    [phone],
    async (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(400).json({ message: "User not found" });

      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user.id, role: user.role }, SECRET);

      res.json({ message: "Login successful", token });
    },
  );
});

module.exports = router;
