const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const sqlite3 = require('sqlite3').verbose();

app.use(express.json());


const db = new sqlite3.Database('nodes.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS nodes (
      id INT PRIMARY KEY,
      node TEXT,
      source TEXT,
      target TEXT,
      FOREIGN KEY (target) REFERENCES employees(node)
  )`);

  db.run(`INSERT INTO nodes (node) VALUES ('ESAME')`);
});

// Configura il middleware CORS
app.use(cors());


app.post('/add-node', (req, res) => {
  const stmt = db.prepare("INSERT INTO nodes (node, source, target) VALUES (?, ?, ?)");
  stmt.run(req.body.target, req.body.source, req.body.target);

  res.status(200).send('Node added');
});

app.post('/remove-node', (req, res) => {
  if (req.body.node === 'ESAME') {
    res.status(400).send('Cannot remove ESAME');
  } else {
    const stmt = db.prepare("DELETE FROM nodes WHERE node = ? or source = ? or target = ?");
    stmt.run(req.body.node, req.body.node, req.body.node);
    res.status(200).send('Node removed');
  }
});

app.post('/get-nodes', (req, res) => {
  db.all("SELECT * FROM nodes", (err, rows) => {
    if (err) {
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send(rows);
    }
  });
});

app.post('/get-nodes-name', (req, res) => {
  db.all("SELECT DISTINCT node FROM nodes", (err, rows) => {
    if (err) {
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send(rows);
    }
  });
});

app.listen(3000, () => console.log("Server is running on port 3000"));