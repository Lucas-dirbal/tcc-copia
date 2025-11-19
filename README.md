# Sistema de Gestão de Equipamentos

Um sistema informatizado para controle, organização e monitoramento de equipamentos em instituições de ensino.

## Visão Geral

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso (TCC) para o curso Técnico em Desenvolvimento de Sistemas. O sistema centraliza dados sobre equipamentos, automatiza processos de empréstimo e fornece relatórios de controle e acompanhamento.

### Objetivo Geral
Desenvolver um sistema informatizado de gestão de equipamentos para otimizar o controle, organização e uso de recursos nas instituições de ensino.

### Objetivos Específicos
- Facilitar a comunicação entre equipe pedagógica e alunos
- Automatizar o processo de empréstimo de equipamentos
- Criar relatórios de controle e acompanhamento
- Garantir acesso seguro por meio de autenticação de usuários
- Oferecer uma interface simples e responsiva

## Funcionalidades

### Para Alunos
- Visualizar equipamentos disponíveis
- Solicitar empréstimos de equipamentos
- Acompanhar histórico de empréstimos pessoais

### Para Equipe Pedagógica
- Gerenciar equipamentos (criar, editar, visualizar)
- Aprovar e registrar devoluções de empréstimos
- Acessar relatórios de uso
- Visualizar empréstimos atrasados

### Para Administradores
- Acesso total ao sistema
- Gerenciar usuários (criar, editar, deletar)
- Gerenciar equipamentos
- Acessar todos os relatórios
- Manutenção geral da plataforma

## Tecnologias Utilizadas

### Backend
- **Node.js**: Runtime JavaScript para servidor
- **Express.js**: Framework web para criar APIs REST
- **SQLite3**: Banco de dados relacional
- **bcryptjs**: Criptografia de senhas
- **express-session**: Gerenciamento de sessões

### Frontend
- **HTML5**: Estrutura das páginas
- **CSS3**: Estilização responsiva
- **JavaScript (Vanilla)**: Lógica do cliente

## Estrutura do Projeto

```
tcc-copia/
├── src/
│   ├── server.js          # Servidor Express e rotas
│   ├── db.js              # Configuração do banco de dados
│   └── database.sqlite    # Arquivo do banco de dados
├── public/
│   ├── index.html         # Página inicial
│   ├── login.html         # Página de login
│   ├── register.html      # Página de registro
│   ├── sistema.html       # Dashboard
│   ├── equipamentos/      # Páginas de equipamentos
│   ├── loans.html         # Página de empréstimos
│   ├── reports.html       # Página de relatórios
│   ├── sobre.html         # Página sobre
│   ├── css/               # Arquivos de estilo
│   └── js/                # Arquivos JavaScript
├── package.json           # Dependências do projeto
└── README.md              # Este arquivo
```

## Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm (gerenciador de pacotes)

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/Lucas-dirbal/tcc-copia.git
cd tcc-copia
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

## Uso

### Primeiro Acesso

1. Acesse `http://localhost:3000`
2. Clique em "Registrar" para criar uma nova conta
3. Selecione o tipo de usuário (aluno, pedagógico ou admin)
4. Faça login com suas credenciais

### Credenciais Padrão

Um usuário administrador é criado automaticamente na primeira execução:
- **Usuário**: admin
- **Senha**: admin123
- **Email**: admin@escola.com

### Navegação

- **Equipamentos**: Visualize e gerencie equipamentos cadastrados
- **Empréstimos**: Solicite empréstimos ou gerencie solicitações
- **Relatórios**: Acesse estatísticas e históricos (apenas pedagógico e admin)
- **Sobre**: Informações sobre o sistema

## API REST

### Autenticação

#### Login
```
POST /api/login
Content-Type: application/json

{
  "username": "usuario",
  "password": "senha"
}
```

#### Registro
```
POST /api/register
Content-Type: application/json

{
  "username": "novo_usuario",
  "password": "senha",
  "email": "usuario@email.com",
  "role": "aluno" // aluno, pedagogico, admin
}
```

#### Logout
```
POST /api/logout
```

### Equipamentos

#### Listar todos
```
GET /api/equipments
```

#### Obter detalhes
```
GET /api/equipments/:id
```

#### Criar novo
```
POST /api/equipments
Content-Type: application/json

{
  "name": "Nome do Equipamento",
  "description": "Descrição (opcional)",
  "location": "Localização",
  "serial_number": "Número de série (opcional)"
}
```

#### Atualizar
```
PUT /api/equipments/:id
Content-Type: application/json

{
  "name": "Novo nome",
  "location": "Nova localização",
  "status": "Disponível"
}
```

#### Deletar
```
DELETE /api/equipments/:id
```

### Empréstimos

#### Solicitar empréstimo
```
POST /api/loans
Content-Type: application/json

{
  "equipment_id": 1
}
```

#### Listar empréstimos
```
GET /api/loans
```

#### Registrar devolução
```
PUT /api/loans/:id/return
```

### Relatórios

#### Uso de equipamentos
```
GET /api/reports/equipment-usage
```

#### Histórico de empréstimos
```
GET /api/reports/loans-history
```

#### Empréstimos atrasados
```
GET /api/reports/overdue-loans
```

## Banco de Dados

### Tabelas

#### users
- `id`: Identificador único
- `username`: Nome de usuário (único)
- `password`: Senha criptografada
- `email`: Email do usuário
- `role`: Tipo de usuário (aluno, pedagogico, admin)

#### equipments
- `id`: Identificador único
- `name`: Nome do equipamento
- `description`: Descrição
- `location`: Localização
- `status`: Status (Disponível, Emprestado, Manutenção)
- `serial_number`: Número de série (único)
- `registered_by`: ID do usuário que registrou

#### loans
- `id`: Identificador único
- `equipment_id`: ID do equipamento
- `user_id`: ID do usuário
- `loan_date`: Data do empréstimo
- `return_date`: Data da devolução
- `status`: Status (Emprestado, Devolvido, Atrasado)

## Segurança

- **Criptografia de Senhas**: Utiliza bcryptjs com salt de 10 rounds
- **Sessões**: Gerenciadas com express-session e armazenadas em SQLite
- **Autenticação**: Middleware de autenticação em rotas protegidas
- **Autorização**: Verificação de role (função) do usuário

## Desenvolvimento

### Scripts Disponíveis

```bash
npm start      # Inicia o servidor em produção
npm run dev    # Inicia o servidor com nodemon (desenvolvimento)
```

### Variáveis de Ambiente

Você pode configurar as seguintes variáveis:
- `PORT`: Porta do servidor (padrão: 3000)

## Melhorias Futuras

- Implementar autenticação com JWT
- Adicionar sistema de notificações por email
- Criar interface de administração avançada
- Implementar backup automático do banco de dados
- Adicionar gráficos e dashboards mais detalhados
- Implementar sistema de permissões granulares
- Adicionar suporte a múltiplos idiomas

## Contribuindo

Este é um projeto de TCC. Para sugestões ou melhorias, entre em contato com o desenvolvedor.

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## Autor

**Lucas Dircksen Balcevicz**
- Colégio Estadual Profª Reni Correia Gamper
- Curso Técnico em Desenvolvimento de Sistemas
- Orientador: Richardson Schawarski Cruz

## Contato

Para dúvidas ou sugestões sobre o sistema, entre em contato através do GitHub.

---

**Última atualização**: Novembro de 2025
