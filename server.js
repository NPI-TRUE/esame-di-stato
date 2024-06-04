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
      node TEXT UNIQUE,
      description TEXT
  )`);

  db.run(`INSERT OR IGNORE INTO nodes (node) VALUES ('ESAME')`);
});

// Configura il middleware CORS
app.use(cors());


app.post('/add-node', (req, res) => {

  if (req.body.source === null || req.body.target === "") {
      res.status(400).send('Seleziona un argomento di partenza e uno da aggiungere');
      span.style.display = 'none';
      return;
  }

  if (req.body.source == "ESAME" && req.body.target == "ESAME") {
    res.status(400).send("Impossibile aggiungere un collegamento tra ESAME e ESAME");
    return;
  }


  const query = db.prepare("INSERT OR IGNORE INTO nodes (node, description) VALUES (?, ?)");

  query.run(req.body.source, req.body.description, (err) => {
    if (err) {
      console.error(err);
    }
  });

  query.run(req.body.target, req.body.description, (err) => {
    if (err) {
      console.error(err);
    }
  });

  const query_edge = db.prepare("INSERT INTO edges (source, target) VALUES (?, ?)");
  query_edge.run(req.body.target, req.body.source);

  res.status(200).send('Node added');
});

app.post('/edit-node', (req, res) => {

  if (req.body.node === 'ESAME') {
    res.status(400).send('Impossibile modificare ESAME');
    return;
  }

  const query = db.prepare("UPDATE nodes SET description = ? WHERE node = ?");
  query.run(req.body.description, req.body.node);

  res.status(200).send('Node updated');
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

app.post('/remove-edge', (req, res) => {

  if (req.body.source == req.body.target) {
    res.status(400).send('Impossibile rimuovere un collegamento tra lo stesso nodo');
    return;
  }

  const query = db.prepare("DELETE FROM edges WHERE source = ? AND target = ? or source = ? AND target = ?");
  query.run(req.body.source, req.body.target, req.body.target, req.body.source);
  res.status(200).send('Edge removed');
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