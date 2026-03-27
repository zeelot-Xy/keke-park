const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

/* ===============================
   RECORD DRIVER DAILY PAYMENT
================================ */
router.post("/drivers/:driver_id/payment", auth, admin, (req, res) => {
  const driverId = parseInt(req.params.driver_id);
  const { amount } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({
      message: "Invalid payment amount",
    });
  }

  // check if driver exists
  const checkDriverQuery = `
    SELECT id FROM drivers
    WHERE id = ?
  `;

  db.query(checkDriverQuery, [driverId], (err, driverResult) => {
    if (err) return res.status(500).json(err);

    if (driverResult.length === 0) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    // check if payment already exists for today
    const checkPaymentQuery = `
      SELECT id FROM payments
      WHERE driver_id = ?
      AND payment_date = CURDATE()
      AND status = 'paid'
    `;

    db.query(checkPaymentQuery, [driverId], (err, paymentResult) => {
      if (err) return res.status(500).json(err);

      if (paymentResult.length > 0) {
        return res.status(400).json({
          message: "Driver has already paid for today",
        });
      }

      // insert today's payment
      const insertPaymentQuery = `
        INSERT INTO payments (driver_id, amount, payment_date, status)
        VALUES (?, ?, CURDATE(), 'paid')
      `;

      db.query(insertPaymentQuery, [driverId, amount], (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "Payment recorded successfully",
          payment_id: result.insertId,
          driver_id: driverId,
          amount: Number(amount),
        });
      });
    });
  });
});

module.exports = router;
