import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'poster_editor',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

export async function initDB() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
  });

  await conn.query('CREATE DATABASE IF NOT EXISTS poster_editor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await conn.end();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guests (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      title VARCHAR(200) DEFAULT '',
      image LONGTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      template_id VARCHAR(20) NOT NULL,
      data JSON NOT NULL,
      thumbnail LONGTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  console.log('[DB] Database and tables initialized');
}
