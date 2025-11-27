require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, db2 } = require('./database.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const {authenticateToken, authorizeRole} = require('./middleware/auth.js');
const app = express();
const port = process.env.PORT || 3100;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('TESTTT!');
});

app.listen(port, () => {
  console.log(`Jalankan perintah di http://localhost:${port}`);
});

app.get('/status', (req,res) => {
    res.json({status: 'OK', message: 'Server berjalan dengan baik', timestamp: new Date()});
});

app.get('/movies',(req,res) => {
    const sql = 'SELECT * FROM movies order by id asc';
    db.all(sql, [], (err, rows) => {
        if (err) {
           return res.status(400).json({"error": err.message});
        }
        // //respon bukan array
        // res.json({
        //     'message': 'success',
        //     'data': rows
        // });

        //respon array
        res.json(rows);
    });
});

app.get('/movies/:id', (req,res) => {
    const sql = 'SELECT * FROM movies WHERE id = ?';
    const params = [req.params.id];
    db.get(sql, params, (err, row) => {
        if (err) {
            return res.status(400).json({"error": err.message});
        }

        //penambahan respon 404 saat data tidak ditemukan
        if (!row) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // //respon bukan array (bukan skema yang diminta)
        // res.json({
        //     'message': 'success',
        //     'data': row
        // });

        //respon array (skema yang diminta)
         res.json(row);
    });
});

app.post('/movies',authenticateToken, (req,res) => {
    const { title, director, year } = req.body;

    if (!title || !director || !year) {
        return res.status(400).json({ error: 'title, director, dan year wajib diisi' });
    }

    const sql = 'INSERT INTO movies (title, director, year) VALUES (?,?,?)';
    const params = [title, director, year];
    db.run(sql, params, function(err) {
        if (err){
            return res.status(500).json({"error": err.message});
        }
         res.status(201).json({ id: this.lastID, title, director, year });
    });
});

app.put('/movies/:id', authenticateToken, authorizeRole(`admin`), (req, res) => {
    const { title, director, year } = req.body;
    const { id } = req.params;
    const sql = 'UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?';
    const params = [title, director, year, id];
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json({ message: 'success', data: { id, title, director, year } });
    });
});

app.delete('/movies/:id', authenticateToken, authorizeRole(`admin`), (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM movies WHERE id = ?';
    db.run(sql, id, function(err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        // //memberikan pesan bahwa data berhasil dihapus
        // res.json({ message: 'deleted', changes: this.changes });
        
        //respon 204 No Content ketika data berhasil dihapus
        res.status(204).send();
    });
});

app.get('/directors',(req,res) => {
    const sql = 'SELECT * FROM directors order by id asc';
    db2.all(sql, [], (err, rows) => {
        if (err) {
           return res.status(400).json({"error": err.message});
        }
        res.json({
            'message': 'success',
            'data': rows
        });
    });
});

app.get('/directors/:id', (req,res) => {
    const sql = 'SELECT * FROM directors WHERE id = ?';
    const params = [req.params.id];
    db2.get(sql, params, (err, row) => {
        if (err) {
            return res.status(400).json({"error": err.message});
        }
        if (!row) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json({
            'message': 'success',
            'data': row
        });
    });
});

app.post('/directors',authenticateToken, (req,res) => {
    const { name, birth_year } = req.body;
    if (!name || !birth_year) {
        return res.status(400).json({ error: 'name dan birth_year wajib diisi' });
    }
    const sql = 'INSERT INTO directors (name, birth_year) VALUES (?,?)';
    const params = [name, birth_year];
    db2.run(sql, params, function(err) {
        if (err){
            return res.status(500).json({"error": err.message});
        }
            res.status(201).json({ id: this.lastID, name, birth_year });
    });
});

app.put('/directors/:id',authenticateToken, authorizeRole(`admin`), (req, res) => {
    const { name, birth_year } = req.body;
    const { id } = req.params;
    const sql = 'UPDATE directors SET name = ?, birth_year = ? WHERE id = ?';
    const params = [name, birth_year, id];
    db2.run(sql, params, function(err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Director not found' });
        }
        res.json({ message: 'success', data: { id, name, birth_year } });
    });
});

app.delete('/directors/:id',authenticateToken, authorizeRole(`admin`), (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM directors WHERE id = ?';
    db2.run(sql, id, function(err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Director not found' });
        }
       res.status(204).send();
    });
});

app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username dan password (min 6 char) harus diisi' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing:", err);
      return res.status(500).json({ error: 'Gagal memproses pendaftaran' });
    }

    const sql = 'INSERT INTO users(username, password, role) VALUES (?, ?, ?)';
    const params = [username.toLowerCase(), hashedPassword, 'user'];

    db.run(sql, params, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(409).json({ error: 'Username sudah digunakan' });
        }
        console.error("Error inserting user:", err);
        return res.status(500).json({ error: 'Gagal menyimpan pengguna' });
      }
      res.status(201).json({ message: 'Registrasi berhasil', userId: this.lastID });
    });
  });
});

app.post('/auth/register-admin', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username dan password (min 6 char) harus diisi' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing:", err);
      return res.status(500).json({ error: 'Gagal memproses pendaftaran' });
    }

    const sql = 'INSERT INTO users(username, password, role) VALUES (?, ?, ?)';
    const params = [username.toLowerCase(), hashedPassword, 'admin']; // Tetapkan admin

    db.run(sql, params, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(409).json({ error: 'Username admin sudah ada' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Admin berhasil dibuat', userId: this.lastID });
    });
  });
});


app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password harus diisi' });
  }

  const sql = "SELECT * FROM users WHERE username=?";
  db.get(sql, [username.toLowerCase()], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(401).json({ error: 'Kredensial tidak valid' });
      }

      const payload = { user: { id: user.id, username: user.username, role: user.role } };

      jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
        if (err) {
          console.error("Error signing token:", err);
          return res.status(500).json({ error: 'Gagal membuat token' });
        }
        res.json({ message: 'Login berhasil', token: token });
      });
    });
  });
});



//handling 404
app.use((req,res) => {
    res.status(404).json({error: 'endpoint not found'});
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});
