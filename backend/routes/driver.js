const express = require("express");
const upload = require("../middleware/upload");
const db = require("../db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

// =========================
// CREATE DRIVER
// =========================
router.post(
  "/create",
  auth,
  upload.fields([
    { name: "passport", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  (req, res) => {
    const { plate_number, park_id } = req.body;
    const user_id = req.user.id;

    // Validate files
    if (!req.files || !req.files.passport || !req.files.license) {
      return res.status(400).json({
        error: "Passport and license images are required",
      });
    }

    const passport = req.files.passport[0].filename;
    const license = req.files.license[0].filename;

    const query = `
      INSERT INTO drivers 
      (user_id, plate_number, park_id, passport_image, license_image) 
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [user_id, plate_number, park_id, passport, license],
      (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ message: "Driver profile created" });
      },
    );
  },
);
// =========================
// GET LOGGED-IN DRIVER PROFILE
// =========================
router.get("/me", auth, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      drivers.id,
      users.name AS driver_name,
      park.park_name AS park_name,
      drivers.plate_number,
      drivers.passport_image,
      drivers.license_image,
      drivers.approval_status
    FROM drivers
    JOIN users ON drivers.user_id = users.id
    JOIN park ON drivers.park_id = park.id
    WHERE drivers.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    res.json(results[0]);
  });
});
// =========================
// GET ALL DRIVERS (WITH RELATION)
// =========================
router.get("/", (req, res) => {
  const { status, search, page = 1, limit = 5 } = req.query;

  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      drivers.id,
      users.name AS driver_name,
      park.park_name AS park_name,
      drivers.plate_number,
      drivers.passport_image,
      drivers.license_image,
      drivers.approval_status,
      drivers.created_at
    FROM drivers
    JOIN users ON drivers.user_id = users.id
    JOIN park ON drivers.park_id = park.id
  `;

  const conditions = [];
  const params = [];

  // status filter
  if (status) {
    conditions.push("drivers.approval_status = ?");
    params.push(status);
  }

  // search filter
  if (search) {
    conditions.push("(users.name LIKE ? OR drivers.plate_number LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  // apply filters
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  // add pagination
  query += " LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json(err);

    const drivers = results.map((driver) => ({
      ...driver,
      passport_image: `http://localhost:5000/uploads/${driver.passport_image}`,
      license_image: `http://localhost:5000/uploads/${driver.license_image}`,
    }));

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      results: drivers,
    });
  });
});
// =========================
// DRIVER APPROVAL SYSTEM
// =========================
// APPROVE driver
router.patch("/:id/approve", auth, admin, (req, res) => {
  const driverId = parseInt(req.params.id);

  const query = `
    UPDATE drivers 
    SET approval_status = 'approved'
    WHERE id = ?
  `;

  db.query(query, [driverId], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({ message: "Driver approved successfully" });
  });
});
// REJECT driver
router.patch("/:id/reject", auth, admin, (req, res) => {
  const driverId = parseInt(req.params.id);

  const query = `
    UPDATE drivers 
    SET approval_status = 'rejected'
    WHERE id = ?
  `;

  db.query(query, [driverId], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({ message: "Driver rejected successfully" });
  });
});
// =========================
// GET SINGLE DRIVER (WITH RELATION)
// =========================
router.get("/:id", (req, res) => {
  const driverId = parseInt(req.params.id);

  const query = `
  SELECT 
    drivers.id,
    users.name AS driver_name,
    park.park_name AS park_name,
    drivers.plate_number,
    drivers.passport_image,
    drivers.license_image,
    drivers.approval_status,
    drivers.created_at
  FROM drivers
  JOIN users ON drivers.user_id = users.id
  JOIN park ON drivers.park_id = park.id
  WHERE drivers.id = ?
`;

  db.query(query, [driverId], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const driver = results[0];

    const formattedDriver = {
      ...driver,
      passport_image: `http://localhost:5000/uploads/${driver.passport_image}`,
      license_image: `http://localhost:5000/uploads/${driver.license_image}`,
    };

    res.json(formattedDriver);
  });
});

module.exports = router;
