# Análise do Projeto - Sistema de Gestão de Equipamentos

## Requisitos do TCC

### Objetivo Geral
Desenvolver um sistema informatizado de gestão de equipamentos para otimizar o controle, organização e uso de recursos nas instituições de ensino.

### Objetivos Específicos
1. Facilitar a comunicação entre equipe pedagógica e alunos
2. Automatizar o processo de empréstimo de equipamentos
3. Criar relatórios de controle e acompanhamento
4. Garantir acesso seguro por meio de autenticação de usuários
5. Oferecer uma interface simples e responsiva

### Funcionalidades por Perfil de Usuário

#### Alunos
- Solicitar empréstimos de equipamentos
- Consultar materiais disponíveis
- Acompanhar histórico de empréstimos

#### Equipe Pedagógica
- Aprovar solicitações de empréstimo
- Modificar informações sobre equipamentos
- Gerenciar a grade escolar
- Atualizar a localização dos materiais
- Gerar relatórios de uso

#### Administradores
- Acesso total ao sistema
- Criar novas contas de usuários
- Manutenção geral da plataforma
- Gerenciar todos os equipamentos

---

## Estado Atual do Projeto

### ✅ Implementado
- **Backend (Node.js + Express)**
  - Autenticação de usuários com login/logout
  - Registro de novos usuários
  - Sistema de sessões com SQLite
  - Middleware de autenticação e autorização por cargo
  - API para gerenciar usuários (admin)

- **Frontend (HTML/CSS/JavaScript)**
  - Páginas: index.html, login.html, register.html, sobre.html, sistema.html, equipamentos.html
  - Arquivos CSS: style.css, responsive.css, system.css
  - Arquivos JavaScript: auth.js, login.js, main.js, sistema.js, equipamentos.js, equipmentManager.js, loanSystem.js, reports.js, userManager.js

- **Banco de Dados (SQLite)**
  - Tabela de usuários com campos: id, username, password, email, role

### ⚠️ Melhorias Implementadas
- **Segurança**: Implementação de criptografia de senhas com bcryptjs
- **Banco de Dados**: Adição das tabelas de equipamentos e empréstimos

### ❌ Faltando Implementar

#### Backend (APIs)
1. **Gerenciamento de Equipamentos**
   - GET /api/equipments - Listar todos os equipamentos
   - GET /api/equipments/:id - Obter detalhes de um equipamento
   - POST /api/equipments - Criar novo equipamento (admin/pedagógico)
   - PUT /api/equipments/:id - Atualizar equipamento (admin/pedagógico)
   - DELETE /api/equipments/:id - Deletar equipamento (admin)

2. **Sistema de Empréstimos**
   - POST /api/loans - Solicitar empréstimo (aluno)
   - GET /api/loans - Listar empréstimos (com filtros por usuário)
   - PUT /api/loans/:id - Aprovar/Rejeitar empréstimo (pedagógico)
   - PUT /api/loans/:id/return - Registrar devolução (pedagógico)

3. **Relatórios**
   - GET /api/reports/equipment-usage - Relatório de uso de equipamentos
   - GET /api/reports/loans-history - Histórico de empréstimos
   - GET /api/reports/overdue-loans - Empréstimos atrasados

#### Frontend
1. **Páginas de Equipamentos**
   - Listar equipamentos com filtros
   - Formulário de cadastro de equipamentos
   - Detalhes e edição de equipamentos

2. **Páginas de Empréstimos**
   - Solicitar empréstimo
   - Listar solicitações de empréstimo (pedagógico)
   - Aprovar/Rejeitar solicitações
   - Registrar devolução

3. **Páginas de Relatórios**
   - Dashboard com estatísticas
   - Relatório de uso de equipamentos
   - Histórico de empréstimos
   - Equipamentos atrasados

4. **Gerenciamento de Usuários (Admin)**
   - Interface para criar/editar/deletar usuários
   - Visualizar lista de usuários

---

## Próximos Passos

1. Implementar as APIs de equipamentos
2. Implementar as APIs de empréstimos
3. Implementar as APIs de relatórios
4. Desenvolver as páginas e interfaces do frontend
5. Testes de funcionalidade
6. Testes de segurança
7. Deploy e documentação
