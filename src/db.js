const Database = require('better-sqlite3');
const path = require('path');

// Caminho do banco de dados
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Criação da tabela de usuários
const createTable = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  email TEXT,
  role TEXT
);
`;
db.exec(createTable);

module.exports = db;

// Criação da tabela de equipamentos
const createEquipmentTable = `
CREATE TABLE IF NOT EXISTS equipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'Disponível',
  serial_number TEXT UNIQUE,
  registered_by INTEGER,
  FOREIGN KEY(registered_by) REFERENCES users(id)
);
`;
db.exec(createEquipmentTable);

// Criação da tabela de empréstimos
const createLoanTable = `
CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  loan_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT NOT NULL DEFAULT 'Emprestado', -- Pode ser 'Emprestado', 'Devolvido', 'Atrasado'
  FOREIGN KEY(equipment_id) REFERENCES equipments(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`;
db.exec(createLoanTable);

// Inserir um usuário administrador padrão para testes
const adminUser = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminUser) {
  const bcrypt = require("bcryptjs");
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)").run("admin", hashedPassword, "admin@escola.com", "admin");
  console.log("Usuário 'admin' criado com senha 'admin123'");
}
