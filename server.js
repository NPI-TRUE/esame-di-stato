const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { Console } = require('console');
const app = express();
const sqlite3 = require('sqlite3').verbose();

app.use(express.json());


const db = new sqlite3.Database('graph.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS edges (
      id INT PRIMARY KEY,
      source TEXT,
      target TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS nodes (
      id INT PRIMARY KEY,
      node TEXT
  )`);

  db.run(`INSERT INTO nodes (node) VALUES ('ESAME')`);
});

// Configura il middleware CORS
app.use(cors());


app.post('/add-node', (req, res) => {

  if (req.body.source == "ESAME" && req.body.target == "ESAME") {
    res.status(400).send("Impossibile");
    return;
  }

  const control = db.prepare("SELECT 1 FROM nodes WHERE node = ?")
  control.get(req.body.source, (err, row) => {
    if (err) {
      console.error(err);
      return;
    }

    const sourceExists = !!row;

    if (!sourceExists) {
      const query = db.prepare("INSERT INTO nodes (node) VALUES (?)");
      query.run(req.body.source, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  });

  control.get(req.body.target, (err, row) => {
    if (err) {
      console.error(err);
      return;
    }

    const targetExists = !!row;
    
    if (!targetExists) {
      const query = db.prepare("INSERT INTO nodes (node) VALUES (?)");
      query.run(req.body.target, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  });

  const query = db.prepare("INSERT INTO edges (source, target) VALUES (?, ?)");
  query.run(req.body.target, req.body.source);

  res.status(200).send('Node added');
});

app.post('/remove-node', (req, res) => {
  if (req.body.node === 'ESAME') {
    res.status(400).send('Cannot remove ESAME');
  } else {
    let stmt = db.prepare("DELETE FROM nodes WHERE node = ?");
    stmt.run(req.body.node);

    stmt = db.prepare("DELETE FROM edges WHERE source = ? or target = ?")
    stmt.run(req.body.node, req.body.node)
    res.status(200).send('Node removed');
  }
});

app.post('/get-nodes', (req, res) => {
  db.all("SELECT * FROM edges", (err, edges) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }

    db.all("SELECT * FROM nodes", (err, nodes) => {
      if (err) {
        return res.status(500).send('Internal Server Error');
      }

      res.status(200).send([edges, nodes]);
    });
  });
});
app.post('/get-nodes-name', (req, res) => {
  db.all("SELECT * FROM nodes", (err, rows) => {
    if (err) {
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send(rows);
    }
  });
});

app.listen(3000, () => console.log("Server is running on port 3000"));