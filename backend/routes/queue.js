const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

/* ===============================
   DRIVER JOIN QUEUE
================================ */
router.post("/join", auth, (req, res) => {
  const userId = req.user.id;

  // find approved driver
  const findDriver = `
    SELECT id FROM drivers
    WHERE user_id = ? AND approval_status = 'approved'
  `;

  db.query(findDriver, [userId], (err, driverResult) => {
    if (err) return res.status(500).json(err);

    if (driverResult.length === 0) {
      return res.status(400).json({ message: "Driver not approved" });
    }

    const driverId = driverResult[0].id;

    // check today's payment
    const checkPayment = `
      SELECT id FROM payments
      WHERE driver_id = ?
      AND payment_date = CURDATE()
      AND status = 'paid'
    `;

    db.query(checkPayment, [driverId], (err, paymentResult) => {
      if (err) return res.status(500).json(err);

      if (paymentResult.length === 0) {
        return res.status(400).json({
          message: "Daily park fee not paid",
        });
      }

      // check if already waiting TODAY
      const checkQueue = `
        SELECT id FROM queue
        WHERE driver_id = ?
        AND status = 'waiting'
        AND queue_date = CURDATE()
      `;

      db.query(checkQueue, [driverId], (err, queueResult) => {
        if (err) return res.status(500).json(err);

        if (queueResult.length > 0) {
          return res.status(400).json({
            message: "Driver already waiting in queue",
          });
        }

        // join today's queue
        const joinQueue = `
          INSERT INTO queue (driver_id, queue_date)
          VALUES (?, CURDATE())
        `;

        db.query(joinQueue, [driverId], (err) => {
          if (err) return res.status(500).json(err);

          res.json({ message: "Driver joined queue successfully" });
        });
      });
    });
  });
});

/* ===============================
   VIEW TODAY'S QUEUE
================================ */
router.get("/", (req, res) => {
  const query = `
    SELECT 
      queue.id AS queue_id,
      users.name AS driver_name,
      drivers.plate_number,
      park.park_name,
      queue.status,
      queue.joined_at
    FROM queue
    JOIN drivers ON queue.driver_id = drivers.id
    JOIN users ON drivers.user_id = users.id
    JOIN park ON drivers.park_id = park.id
    WHERE queue.queue_date = CURDATE()
    ORDER BY queue.joined_at ASC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});
/* ===============================
   GET CURRENT LOADING DRIVER
================================ */
router.get("/current-loading", auth, admin, (req, res) => {
  const query = `
    SELECT 
      queue.id AS queue_id,
      users.name AS driver_name,
      drivers.plate_number,
      park.park_name,
      queue.joined_at
    FROM queue
    JOIN drivers ON queue.driver_id = drivers.id
    JOIN users ON drivers.user_id = users.id
    JOIN park ON drivers.park_id = park.id
    WHERE queue.status = 'loading'
    AND queue.queue_date = CURDATE()
    LIMIT 1
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.json({ message: "No driver currently loading" });
    }

    res.json(results[0]);
  });
});
/* ===============================
   GET WAITING DRIVERS
================================ */
router.get("/waiting", auth, admin, (req, res) => {
  const query = `
    SELECT 
      queue.id AS queue_id,
      users.name AS driver_name,
      drivers.plate_number,
      park.park_name,
      queue.joined_at
    FROM queue
    JOIN drivers ON queue.driver_id = drivers.id
    JOIN users ON drivers.user_id = users.id
    JOIN park ON drivers.park_id = park.id
    WHERE queue.status = 'waiting'
    AND queue.queue_date = CURDATE()
    ORDER BY queue.joined_at ASC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);

    res.json(results);
  });
});

/* ===============================
   LOAD NEXT DRIVER (ADMIN)
================================ */
router.patch("/load-next", auth, admin, (req, res) => {
  const checkLoadingQuery = `
    SELECT * FROM queue
    WHERE status = 'loading'
    AND queue_date = CURDATE()
    LIMIT 1
  `;

  db.query(checkLoadingQuery, (err, loadingResult) => {
    if (err) return res.status(500).json(err);

    if (loadingResult.length > 0) {
      return res.status(400).json({
        message: "Another driver is already loading",
      });
    }

    const findDriverQuery = `
      SELECT * FROM queue
      WHERE status = 'waiting'
      AND queue_date = CURDATE()
      ORDER BY joined_at ASC
      LIMIT 1
    `;

    db.query(findDriverQuery, (err, results) => {
      if (err) return res.status(500).json(err);

      if (results.length === 0) {
        return res.json({ message: "No drivers waiting today" });
      }

      const driver = results[0];

      const updateQuery = `
        UPDATE queue
        SET status = 'loading'
        WHERE id = ?
      `;

      db.query(updateQuery, [driver.id], (err) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "Driver moved to loading",
          queue_id: driver.id,
        });
      });
    });
  });
});

/* ===============================
   COMPLETE LOADING
================================ */
router.patch("/complete/:id", auth, admin, (req, res) => {
  const queueId = req.params.id;

  const findQuery = `
  SELECT * FROM queue
  WHERE id = ?
  AND queue_date = CURDATE()
  AND status = 'loading'`;

  db.query(findQuery, [queueId], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(404).json({ message: "Loading record not found" });
    }

    const record = results[0];

    const updateQuery = `
      UPDATE queue
      SET status = 'completed'
      WHERE id = ?
    `;

    db.query(updateQuery, [queueId], (err) => {
      if (err) return res.status(500).json(err);

      const logQuery = `
        INSERT INTO load_logs (driver_id, loaded_at, completed_at)
        VALUES (?, NOW(), NOW())
      `;

      db.query(logQuery, [record.driver_id], (err) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "Loading completed",
          driver_id: record.driver_id,
        });
      });
    });
  });
});

/* ===============================
   DRIVER QUEUE POSITION
================================ */
router.get("/position/:driver_id", (req, res) => {
  const driverId = req.params.driver_id;

  const query = `
    SELECT COUNT(*) AS position
    FROM queue
    WHERE status = 'waiting'
    AND queue_date = CURDATE()
    AND joined_at <= (
      SELECT joined_at
      FROM queue
      WHERE driver_id = ?
      AND status = 'waiting'
      AND queue_date = CURDATE()
      LIMIT 1
    )
  `;

  db.query(query, [driverId], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results[0].position === 0 || results[0].position === null) {
      return res.status(404).json({ message: "Driver not in queue" });
    }

    res.json({
      driver_id: driverId,
      position: results[0].position,
    });
  });
});

module.exports = router;
