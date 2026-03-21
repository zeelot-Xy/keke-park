const express = require("express");
const upload = require("../middleware/upload");
const db = require("../db");

const router = express.Router();

router.post(
  "/create",
  upload.fields([
    { name: "passport", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  (req, res) => {
    const { user_id, plate_number, park_id } = req.body;

    if (!req.files || !req.files.passport || !req.files.license) {
      return res.status(400).json({
        error: "Passport and license images are required",
      });
    }

    const passport = req.files["passport"][0].filename;
    const license = req.files["license"][0].filename;

    db.query(
      "INSERT INTO drivers (user_id, plate_number, park_id, passport_image, license_image) VALUES (?, ?, ?, ?, ?)",
      [user_id, plate_number, park_id, passport, license],
      (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ message: "Driver profile created" });
      },
    );
  },
);

// GET all drivers
router.get("/", (req, res) => {
  db.query("SELECT * FROM drivers", (err, results) => {
    if (err) return res.status(500).json(err);

    // Map results to include full image URLs
    const drivers = results.map((driver) => ({
      ...driver,
      passport_image: `http://localhost:5000/uploads/${driver.passport_image}`,
      license_image: `http://localhost:5000/uploads/${driver.license_image}`,
    }));

    res.json(drivers);
  });
});
// GET single driver by ID
router.get("/:id", (req, res) => {
  const driverId = req.params.id;

  console.log("Driver ID:", driverId);
  console.log("GET /:id route hit");

  db.query("SELECT * FROM drivers WHERE id = ?", [driverId], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const driver = results[0];

    // Map results to include full image URLs
    const formattedDriver = {
      ...driver,
      passport_image: `http://localhost:5000/uploads/${driver.passport_image}`,
      license_image: `http://localhost:5000/uploads/${driver.license_image}`,
    };

    res.json(formattedDriver);
  });
});
module.exports = router;
