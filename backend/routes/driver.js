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

    console.log(req.files);

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

module.exports = router;
