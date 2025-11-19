const express = require("express");
const path = require("path");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

// Sessões
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite", dir: __dirname }),
    secret: "seu-segredo-aqui",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Middleware de autenticação
function requireAuth(req, res, next) {
  if (req.session.user) next();
  else res.redirect("/login");
}

// Middleware por cargo
function requireRole(...roles) {
  return (req, res, next) => {
    if (req.session.user && roles.includes(req.session.user.role)) next();
    else res.status(403).json({ success: false, message: "Acesso negado!" });
  };
}

// ==================== ROTAS DE PÁGINAS ====================

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "register.html")));
app.get("/sobre", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "sobre.html")));
app.get("/sistema", requireAuth, (req, res) => res.sendFile(path.join(__dirname, "..", "public", "sistema.html")));
app.get("/equipamentos", requireAuth, (req, res) => res.sendFile(path.join(__dirname, "..", "public", "equipamentos", "equipamentos.html")));

// ==================== AUTENTICAÇÃO ====================

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (!user) return res.status(401).json({ success: false, message: "Usuário não encontrado" });

  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ success: false, message: "Senha incorreta" });

  req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role };
  res.json({ success: true, user: req.session.user });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.post("/api/register", (req, res) => {
  const { username, password, email, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!username || !password || !email || !role)
    return res.status(400).json({ success: false, message: "Campos obrigatórios" });

  try {
    const stmt = db.prepare("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)");
    const info = stmt.run(username, hashedPassword, email, role);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ success: false, message: "Usuário já existe" });
    } else {
      res.status(500).json({ success: false, message: "Erro ao registrar usuário" });
    }
  }
});

app.get("/api/user", (req, res) => {
  if (req.session.user) res.json({ success: true, user: req.session.user });
  else res.json({ success: false });
});

// ==================== GERENCIAMENTO DE USUÁRIOS ====================

app.get("/api/users", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const users = db.prepare("SELECT id, username, email, role FROM users").all();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao buscar usuários" });
  }
});

app.put("/api/user/:id", requireAuth, requireRole("admin"), (req, res) => {
  const userId = parseInt(req.params.id);
  const { username, email, role, password } = req.body;
  if (!username && !email && !role && !password) {
    return res.status(400).json({ success: false, message: "Nenhum dado para atualizar" });
  }
  try {
    let fields = [];
    let values = [];
    if (username) { fields.push("username = ?"); values.push(username); }
    if (email) { fields.push("email = ?"); values.push(email); }
    if (role) { fields.push("role = ?"); values.push(role); }
    if (password) { 
      const hashedPassword = bcrypt.hashSync(password, 10);
      fields.push("password = ?"); 
      values.push(hashedPassword); 
    }
    values.push(userId);
    const stmt = db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`);
    const info = stmt.run(...values);
    if (info.changes > 0) {
      res.json({ success: true, message: "Usuário atualizado com sucesso!" });
    } else {
      res.status(404).json({ success: false, message: "Usuário não encontrado" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao atualizar usuário" });
  }
});

app.delete("/api/user/:id", requireAuth, requireRole("admin"), (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const stmt = db.prepare("DELETE FROM users WHERE id = ?");
    const info = stmt.run(userId);
    if (info.changes > 0) {
      res.json({ success: true, message: "Usuário deletado com sucesso!" });
    } else {
      res.status(404).json({ success: false, message: "Usuário não encontrado" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao deletar usuário" });
  }
});

// ==================== GERENCIAMENTO DE EQUIPAMENTOS ====================

// Listar todos os equipamentos
app.get("/api/equipments", requireAuth, (req, res) => {
  try {
    const equipments = db.prepare("SELECT * FROM equipments").all();
    res.json({ success: true, equipments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao buscar equipamentos" });
  }
});

// Obter detalhes de um equipamento
app.get("/api/equipments/:id", requireAuth, (req, res) => {
  const equipmentId = parseInt(req.params.id);
  try {
    const equipment = db.prepare("SELECT * FROM equipments WHERE id = ?").get(equipmentId);
    if (equipment) {
      res.json({ success: true, equipment });
    } else {
      res.status(404).json({ success: false, message: "Equipamento não encontrado" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao buscar equipamento" });
  }
});

// Criar novo equipamento (admin e pedagógico)
app.post("/api/equipments", requireAuth, requireRole("admin", "pedagogico"), (req, res) => {
  const { name, description, location, serial_number } = req.body;

  if (!name || !location) {
    return res.status(400).json({ success: false, message: "Nome e localização são obrigatórios" });
  }

  try {
    const stmt = db.prepare("INSERT INTO equipments (name, description, location, status, serial_number, registered_by) VALUES (?, ?, ?, ?, ?, ?)");
    const info = stmt.run(name, description || null, location, "Disponível", serial_number || null, req.session.user.id);
    res.json({ success: true, id: info.lastInsertRowid, message: "Equipamento criado com sucesso!" });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ success: false, message: "Número de série já existe" });
    } else {
      res.status(500).json({ success: false, message: "Erro ao criar equipamento" });
    }
  }
});

// Atualizar equipamento (admin e pedagógico)
app.put("/api/equipments/:id", requireAuth, requireRole("admin", "pedagogico"), (req, res) => {
  const equipmentId = parseInt(req.params.id);
  const { name, description, location, status } = req.body;

  if (!name && !description && !location && !status) {
    return res.status(400).json({ success: false, message: "Nenhum dado para atualizar" });
  }

  try {
    let fields = [];
    let values = [];
    if (name) { fields.push("name = ?"); values.push(name); }
    if (description !== undefined) { fields.push("description = ?"); values.push(description); }
    if (location) { fields.push("location = ?"); values.push(location); }
    if (status) { fields.push("status = ?"); values.push(status); }
    values.push(equipmentId);

    const stmt = db.prepare(`UPDATE equipments SET ${fields.join(", ")} WHERE id = ?`);
    const info = stmt.run(...values);

    if (info.changes > 0) {
      res.json({ success: true, message: "Equipamento atualizado com sucesso!" });
    } else {
      res.status(404).json({ success: false, message: "Equipamento não encontrado" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao atualizar equipamento" });
  }
});

// Deletar equipamento (apenas admin)
app.delete("/api/equipments/:id", requireAuth, requireRole("admin"), (req, res) => {
  const equipmentId = parseInt(req.params.id);
  try {
    const stmt = db.prepare("DELETE FROM equipments WHERE id = ?");
    const info = stmt.run(equipmentId);
    if (info.changes > 0) {
      res.json({ success: true, message: "Equipamento deletado com sucesso!" });
    } else {
      res.status(404).json({ success: false, message: "Equipamento não encontrado" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao deletar equipamento" });
  }
});

// ==================== SISTEMA DE EMPRÉSTIMOS ====================

// Solicitar empréstimo (aluno)
app.post("/api/loans", requireAuth, (req, res) => {
  const { equipment_id } = req.body;

  if (!equipment_id) {
    return res.status(400).json({ success: false, message: "ID do equipamento é obrigatório" });
  }

  try {
    // Verificar se o equipamento existe e está disponível
    const equipment = db.prepare("SELECT * FROM equipments WHERE id = ?").get(equipment_id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipamento não encontrado" });
    }

    if (equipment.status !== "Disponível") {
      return res.status(400).json({ success: false, message: "Equipamento não está disponível" });
    }

    // Criar empréstimo
    const loan_date = new Date().toISOString();
    const stmt = db.prepare("INSERT INTO loans (equipment_id, user_id, loan_date, status) VALUES (?, ?, ?, ?)");
    const info = stmt.run(equipment_id, req.session.user.id, loan_date, "Emprestado");

    // Atualizar status do equipamento
    db.prepare("UPDATE equipments SET status = ? WHERE id = ?").run("Emprestado", equipment_id);

    res.json({ success: true, id: info.lastInsertRowid, message: "Empréstimo solicitado com sucesso!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao solicitar empréstimo" });
  }
});

// Listar empréstimos
app.get("/api/loans", requireAuth, (req, res) => {
  try {
    let query = "SELECT l.*, e.name as equipment_name, u.username FROM loans l JOIN equipments e ON l.equipment_id = e.id JOIN users u ON l.user_id = u.id";
    let params = [];

    // Se for aluno, mostrar apenas seus empréstimos
    if (req.session.user.role === "aluno") {
      query += " WHERE l.user_id = ?";
      params.push(req.session.user.id);
    }

    const loans = db.prepare(query).all(...params);
    res.json({ success: true, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao buscar empréstimos" });
  }
});

// Obter detalhes de um empréstimo
app.get("/api/loans/:id", requireAuth, (req, res) => {
  const loanId = parseInt(req.params.id);
  try {
    const loan = db.prepare("SELECT l.*, e.name as equipment_name, u.username FROM loans l JOIN equipments e ON l.equipment_id = e.id JOIN users u ON l.user_id = u.id WHERE l.id = ?").get(loanId);
    if (loan) {
      res.json({ success: true, loan });
    } else {
      res.status(404).json({ success: false, message: "Empréstimo não encontrado" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao buscar empréstimo" });
  }
});

// Registrar devolução (pedagógico e admin)
app.put("/api/loans/:id/return", requireAuth, requireRole("admin", "pedagogico"), (req, res) => {
  const loanId = parseInt(req.params.id);
  try {
    const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Empréstimo não encontrado" });
    }

    const return_date = new Date().toISOString();
    db.prepare("UPDATE loans SET status = ?, return_date = ? WHERE id = ?").run("Devolvido", return_date, loanId);
    db.prepare("UPDATE equipments SET status = ? WHERE id = ?").run("Disponível", loan.equipment_id);

    res.json({ success: true, message: "Devolução registrada com sucesso!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao registrar devolução" });
  }
});

// ==================== RELATÓRIOS ====================

// Relatório de uso de equipamentos
app.get("/api/reports/equipment-usage", requireAuth, requireRole("admin", "pedagogico"), (req, res) => {
  try {
    const report = db.prepare(`
      SELECT e.id, e.name, COUNT(l.id) as total_loans, 
             SUM(CASE WHEN l.status = 'Devolvido' THEN 1 ELSE 0 END) as returned,
             SUM(CASE WHEN l.status = 'Emprestado' THEN 1 ELSE 0 END) as borrowed
      FROM equipments e
      LEFT JOIN loans l ON e.id = l.equipment_id
      GROUP BY e.id
    `).all();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao gerar relatório" });
  }
});

// Histórico de empréstimos
app.get("/api/reports/loans-history", requireAuth, requireRole("admin", "pedagogico"), (req, res) => {
  try {
    const history = db.prepare(`
      SELECT l.*, e.name as equipment_name, u.username
      FROM loans l
      JOIN equipments e ON l.equipment_id = e.id
      JOIN users u ON l.user_id = u.id
      ORDER BY l.loan_date DESC
    `).all();
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao buscar histórico" });
  }
});

// Empréstimos atrasados
app.get("/api/reports/overdue-loans", requireAuth, requireRole("admin", "pedagogico"), (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const overdue = db.prepare(`
      SELECT l.*, e.name as equipment_name, u.username, u.email
      FROM loans l
      JOIN equipments e ON l.equipment_id = e.id
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'Emprestado' AND l.loan_date < ?
    `).all(today);
    res.json({ success: true, overdue });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao buscar empréstimos atrasados" });
  }
});

// ==================== HEALTH CHECK ====================

app.get("/api/health", (req, res) => res.json({ status: "OK", time: new Date().toISOString() }));

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});
