// ===== SISTEMA DE EMPRÉSTIMOS =====

const LoanSystem = {
  currentUser: null,
  loans: [],
  currentTab: 'meus-emprestimos',

  // Inicializar o sistema
  async init() {
    await this.checkAuth();
    if (!this.currentUser) {
      window.location.href = '/login';
      return;
    }
    
    this.setupEventListeners();
    this.setupTabs();
    await this.loadLoans();
  },

  // Verificar autenticação
  async checkAuth() {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      if (data.success) {
        this.currentUser = data.user;
      }
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
    }
  },

  // Configurar abas
  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabsContainer = document.getElementById('tabsContainer');

    // Mostrar abas baseado na role do usuário
    if (this.currentUser.role === 'pedagogico' || this.currentUser.role === 'admin') {
      const solicitacoesBtn = tabsContainer.querySelector('[data-tab="solicitacoes"]');
      const historicoBtn = tabsContainer.querySelector('[data-tab="historico"]');
      if (solicitacoesBtn) solicitacoesBtn.style.display = 'block';
      if (historicoBtn) historicoBtn.style.display = 'block';
    }

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.switchTab(tab);
      });
    });
  },

  // Trocar aba
  switchTab(tab) {
    this.currentTab = tab;

    // Atualizar botões
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Atualizar conteúdo
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });
    document.getElementById(this.getTabContentId(tab)).style.display = 'block';

    // Carregar dados da aba
    this.loadTabContent(tab);
  },

  // Obter ID do conteúdo da aba
  getTabContentId(tab) {
    const map = {
      'meus-emprestimos': 'meusEmprestimos',
      'solicitacoes': 'solicitacoes',
      'historico': 'historico'
    };
    return map[tab] || 'meusEmprestimos';
  },

  // Carregar dados da aba
  async loadTabContent(tab) {
    switch(tab) {
      case 'meus-emprestimos':
        this.renderMeusEmprestimos();
        break;
      case 'solicitacoes':
        this.renderSolicitacoes();
        break;
      case 'historico':
        this.renderHistorico();
        break;
    }
  },

  // Carregar empréstimos do servidor
  async loadLoans() {
    try {
      const response = await fetch('/api/loans');
      const data = await response.json();
      
      if (data.success) {
        this.loans = data.loans;
        this.renderMeusEmprestimos();
      } else {
        this.showMessage('Erro ao carregar empréstimos', 'error');
      }
    } catch (err) {
      console.error('Erro ao carregar empréstimos:', err);
      this.showMessage('Erro ao carregar empréstimos', 'error');
    }
  },

  // Renderizar meus empréstimos
  renderMeusEmprestimos() {
    const container = document.getElementById('meusEmprestimos');
    
    // Filtrar empréstimos do usuário atual
    const userLoans = this.loans.filter(loan => {
      if (this.currentUser.role === 'aluno') {
        return loan.user_id === this.currentUser.id;
      }
      return true;
    });

    if (userLoans.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Nenhum empréstimo encontrado</p></div>';
      return;
    }

    let html = `
      <table class="loans-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Equipamento</th>
            <th>Usuário</th>
            <th>Data Empréstimo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
    `;

    userLoans.forEach(loan => {
      const statusClass = this.getStatusClass(loan.status);
      let actions = '';

      if (loan.status === 'Emprestado' && this.currentUser.role !== 'aluno') {
        actions = `<button class="btn-small btn-return" onclick="LoanSystem.returnLoan(${loan.id})">Registrar Devolução</button>`;
      }

      const loanDate = new Date(loan.loan_date).toLocaleDateString('pt-BR');

      html += `
        <tr>
          <td>${loan.id}</td>
          <td>${loan.equipment_name}</td>
          <td>${loan.username}</td>
          <td>${loanDate}</td>
          <td><span class="status-badge ${statusClass}">${loan.status}</span></td>
          <td><div class="action-buttons">${actions}</div></td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  },

  // Renderizar solicitações de empréstimo
  async renderSolicitacoes() {
    const container = document.getElementById('solicitacoes');

    try {
      const response = await fetch('/api/loans');
      const data = await response.json();

      if (!data.success) {
        container.innerHTML = '<div class="empty-state"><p>Erro ao carregar solicitações</p></div>';
        return;
      }

      // Filtrar apenas empréstimos pendentes
      const pendingLoans = data.loans.filter(loan => loan.status === 'Emprestado');

      if (pendingLoans.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhuma solicitação pendente</p></div>';
        return;
      }

      let html = `
        <table class="loans-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Equipamento</th>
              <th>Usuário</th>
              <th>Data Solicitação</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
      `;

      pendingLoans.forEach(loan => {
        const loanDate = new Date(loan.loan_date).toLocaleDateString('pt-BR');

        html += `
          <tr>
            <td>${loan.id}</td>
            <td>${loan.equipment_name}</td>
            <td>${loan.username}</td>
            <td>${loanDate}</td>
            <td><span class="status-badge status-emprestado">Emprestado</span></td>
            <td>
              <div class="action-buttons">
                <button class="btn-small btn-return" onclick="LoanSystem.returnLoan(${loan.id})">Registrar Devolução</button>
              </div>
            </td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      container.innerHTML = html;
    } catch (err) {
      console.error('Erro:', err);
      container.innerHTML = '<div class="empty-state"><p>Erro ao carregar solicitações</p></div>';
    }
  },

  // Renderizar histórico de empréstimos
  async renderHistorico() {
    const container = document.getElementById('historico');

    try {
      const response = await fetch('/api/reports/loans-history');
      const data = await response.json();

      if (!data.success) {
        container.innerHTML = '<div class="empty-state"><p>Erro ao carregar histórico</p></div>';
        return;
      }

      if (data.history.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum histórico de empréstimos</p></div>';
        return;
      }

      let html = `
        <table class="loans-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Equipamento</th>
              <th>Usuário</th>
              <th>Data Empréstimo</th>
              <th>Data Devolução</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.history.forEach(loan => {
        const statusClass = this.getStatusClass(loan.status);
        const loanDate = new Date(loan.loan_date).toLocaleDateString('pt-BR');
        const returnDate = loan.return_date ? new Date(loan.return_date).toLocaleDateString('pt-BR') : '-';

        html += `
          <tr>
            <td>${loan.id}</td>
            <td>${loan.equipment_name}</td>
            <td>${loan.username}</td>
            <td>${loanDate}</td>
            <td>${returnDate}</td>
            <td><span class="status-badge ${statusClass}">${loan.status}</span></td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      container.innerHTML = html;
    } catch (err) {
      console.error('Erro:', err);
      container.innerHTML = '<div class="empty-state"><p>Erro ao carregar histórico</p></div>';
    }
  },

  // Obter classe CSS do status
  getStatusClass(status) {
    switch(status) {
      case 'Emprestado': return 'status-emprestado';
      case 'Devolvido': return 'status-devolvido';
      case 'Atrasado': return 'status-atrasado';
      default: return 'status-emprestado';
    }
  },

  // Registrar devolução
  async returnLoan(id) {
    if (!confirm('Deseja registrar a devolução deste equipamento?')) return;

    try {
      const response = await fetch(`/api/loans/${id}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (result.success) {
        this.showMessage('Devolução registrada com sucesso!', 'success');
        await this.loadLoans();
        this.loadTabContent(this.currentTab);
      } else {
        this.showMessage(result.message, 'error');
      }
    } catch (err) {
      console.error('Erro:', err);
      this.showMessage('Erro ao registrar devolução', 'error');
    }
  },

  // Configurar event listeners
  setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  },

  // Fazer logout
  async logout() {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  },

  // Mostrar mensagem
  showMessage(text, type) {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;

    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    
    setTimeout(() => {
      messageBox.className = 'message';
    }, 5000);
  }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  LoanSystem.init();
});
