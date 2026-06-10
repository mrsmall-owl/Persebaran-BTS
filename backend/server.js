require('dotenv').config();

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors({
  origin: "*"
}));
app.use(express.json());

// ======================
// KONEKSI DATABASE
// ======================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ======================
// TEST
// ======================

app.get("/", (req, res) => {
  res.send("Backend WebGIS aktif");
});

// ======================
// AMBIL DATA BTS
// ======================

app.get("/bts", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT
        b.id_bts,
        b.nama_bts,
        b.latitude,
        b.longitude,
        b.tahun,
        b.alamat,

        o.operator,
        j.jaringan,

        w.kab_kota

      FROM bts b

      LEFT JOIN operator o
      ON b.id_operator = o.id_operator

      LEFT JOIN jaringan j
      ON b.id_jaringan = j.id_jaringan

      LEFT JOIN wilayah w
      ON b.id_wilayah = w.id_wilayah
    `);

    res.json(result.rows);

  } catch(err) {

    console.log(err);

    res.status(500).send("Database error");

  }

});

// ======================
// REGISTER
// ======================

app.post("/register", async (req, res) => {

  try {

    const {
      first_name,
      last_name,
      email,
      institution,
      password
    } = req.body;

    // cek email sudah ada atau belum
    const checkUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        message: "Email sudah terdaftar"
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // simpan user
    await pool.query(
      `
      INSERT INTO users
      (first_name, last_name, email, institution, password)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        first_name,
        last_name,
        email,
        institution,
        hashedPassword
      ]
    );

    res.status(201).json({
      message: "Registrasi berhasil"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ======================
// JALANKAN SERVER
// ======================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});