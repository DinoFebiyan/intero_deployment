const e = require('express');

require(`dotenv`).config();
const sqlite3 = require('sqlite3').verbose();

const DBSOURCE1 = process.env.DB_SOURCE1 || "movies.db";
const db = new sqlite3.Database(DBSOURCE1, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            director TEXT NOT NULL,
            year INTEGER NOT NULL
        )`, (err) => {
            if (!err) {
                db.get('SELECT COUNT(*) AS count FROM movies', (err, row) => {
                    if (!err && row.count === 0) {
                        const insert = 'INSERT INTO movies (title, director, year) VALUES (?,?,?)';
                        db.run(insert, ["Merah Putih One for All", "Dino Febiyan", 1945]);
                        db.run(insert, ["tukar Bubur Umroh", "Dimas Adidya", 2010]);
                        db.run(insert, ["Tempes", "Sherly Agista", 2025]);
                    }
                });
            }
        });
    }
});

const DBSOURCE2 = process.env.DB_SOURCE2 || "directors.db";
const db2 = new sqlite3.Database(DBSOURCE2, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db2.run(`CREATE TABLE IF NOT EXISTS directors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            birth_year INTEGER NOT NULL
        )`, (err) => {
            if (!err) {
                db2.get('SELECT COUNT(*) AS count FROM directors', (err, row) => {
                    if (!err && row.count === 0) {
                        const insert = 'INSERT INTO directors (name, birth_year) VALUES (?,?)';
                        db2.run(insert, ["Dino Febiyan", 2006]);
                        db2.run(insert, ["Dimas Adidya", 2000]);
                        db2.run(insert, ["Sherly Agista", 2007]);
                    }
                });
            }
        });
    }
});

 db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT `user`)', (err) => {
 if (err) {
     console.error("Gagal membuat tabel users:",err.message);
  }
});

 db2.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT `user`)', (err) => {
 if (err) {
     console.error("Gagal membuat tabel users:",err.message);
  }
});

// Setelah menghapus semua data dari tabel movies
db2.run('DELETE FROM directors', function(err) {
    if (!err) {
        db2.run("DELETE FROM sqlite_sequence WHERE name='directors'");
    }
});

module.exports = { db, db2 };