const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// API endpoint to fetch data
app.get('/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM student_info');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});

app.put('/new_student', async (req, res) => {
  const { student_name, rfid, status } = req.body;

  if ( !student_name || !rfid  ) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const query = `
      INSERT INTO student_info (student_name, rfid, status)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [student_name, rfid, status];

    const result = await pool.query(query, values);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).send('Error inserting data');
  }
});

app.listen(3000, () => {
  console.log(`API is running at http://localhost:3000`);
});
