require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();

app.use(cors());
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
// JALANKAN SERVER
// ======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});