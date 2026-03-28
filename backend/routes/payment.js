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
/* ===============================
   GET MY QUEUE STATUS
================================ */
router.get("/my-status", auth, (req, res) => {
  const userId = req.user.id;

  const findDriverQuery = `
    SELECT id FROM drivers
    WHERE user_id = ?
    AND approval_status = 'approved'
  `;

  db.query(findDriverQuery, [userId], (err, driverResult) => {
    if (err) return res.status(500).json(err);

    if (driverResult.length === 0) {
      return res
        .status(404)
        .json({ message: "Approved driver profile not found" });
    }

    const driverId = driverResult[0].id;

    const queueQuery = `
      SELECT queue_id, status, joined_at
      FROM (
        SELECT 
          queue.id AS queue_id,
          queue.status,
          queue.joined_at
        FROM queue
        WHERE queue.driver_id = ?
        AND queue.queue_date = CURDATE()
        AND queue.status IN ('waiting', 'loading')
        ORDER BY queue.joined_at DESC
        LIMIT 1
      ) AS q
    `;

    db.query(queueQuery, [driverId], (err, queueResult) => {
      if (err) return res.status(500).json(err);

      if (queueResult.length === 0) {
        return res.json({
          in_queue: false,
          message: "Driver is not currently in queue",
        });
      }

      const current = queueResult[0];

      if (current.status === "waiting") {
        const positionQuery = `
          SELECT COUNT(*) AS position
          FROM queue
          WHERE status = 'waiting'
          AND queue_date = CURDATE()
          AND joined_at <= ?
        `;

        db.query(positionQuery, [current.joined_at], (err, positionResult) => {
          if (err) return res.status(500).json(err);

          res.json({
            in_queue: true,
            queue_id: current.queue_id,
            status: current.status,
            joined_at: current.joined_at,
            position: positionResult[0].position,
          });
        });
      } else {
        res.json({
          in_queue: true,
          queue_id: current.queue_id,
          status: current.status,
          joined_at: current.joined_at,
          position: null,
        });
      }
    });
  });
});

module.exports = router;
