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
  user: "postgres",
  host: "localhost",
  database: "BTS_Riau",
  password: "Dirrasql67",
  port: 5432
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

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});