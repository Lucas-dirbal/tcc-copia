// ===== SISTEMA DE RELATÓRIOS =====

const ReportSystem = {
  currentUser: null,
  currentReport: null,

  // Inicializar o sistema
  async init() {
    await this.checkAuth();
    if (!this.currentUser) {
      window.location.href = '/login';
      return;
    }

    // Verificar permissões
    if (this.currentUser.role === 'aluno') {
      window.location.href = '/';
      return;
    }

    this.setupEventListeners();
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

  // Configurar event listeners
  setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  },

  // Selecionar relatório
  async selectReport(reportType) {
    this.currentReport = reportType;

    // Ocultar menu
    document.getElementById('reportsMenu').style.display = 'none';

    // Mostrar relatório
    document.querySelectorAll('.report-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(reportType).classList.add('active');

    // Carregar dados
    switch(reportType) {
      case 'equipment-usage':
        await this.loadEquipmentUsageReport();
        break;
      case 'loans-history':
        await this.loadLoansHistoryReport();
        break;
      case 'overdue-loans':
        await this.loadOverdueLoansReport();
        break;
    }
  },

  // Voltar ao menu
  backToMenu() {
    this.currentReport = null;

    // Mostrar menu
    document.getElementById('reportsMenu').style.display = 'grid';

    // Ocultar relatórios
    document.querySelectorAll('.report-content').forEach(content => {
      content.classList.remove('active');
    });
  },

  // Carregar relatório de uso de equipamentos
  async loadEquipmentUsageReport() {
    try {
      const response = await fetch('/api/reports/equipment-usage');
      const data = await response.json();

      if (!data.success) {
        this.showMessage('Erro ao carregar relatório', 'error');
        return;
      }

      // Renderizar estatísticas
      const statsContainer = document.getElementById('equipmentUsageStats');
      const tableContainer = document.getElementById('equipmentUsageTable');

      if (data.report.length === 0) {
        statsContainer.innerHTML = '<div class="empty-state"><p>Nenhum equipamento cadastrado</p></div>';
        tableContainer.innerHTML = '';
        return;
      }

      // Calcular estatísticas gerais
      const totalEquipments = data.report.length;
      const totalLoans = data.report.reduce((sum, eq) => sum + (eq.total_loans || 0), 0);
      const activeLoans = data.report.reduce((sum, eq) => sum + (eq.borrowed || 0), 0);

      statsContainer.innerHTML = `
        <div class="stat-box">
          <h4>Total de Equipamentos</h4>
          <div class="value">${totalEquipments}</div>
        </div>
        <div class="stat-box">
          <h4>Total de Empréstimos</h4>
          <div class="value">${totalLoans}</div>
        </div>
        <div class="stat-box">
          <h4>Empréstimos Ativos</h4>
          <div class="value">${activeLoans}</div>
        </div>
        <div class="stat-box">
          <h4>Taxa de Utilização</h4>
          <div class="value">${totalLoans > 0 ? Math.round((activeLoans / totalLoans) * 100) : 0}%</div>
        </div>
      `;

      // Renderizar tabela
      let html = `
        <table class="report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Total de Empréstimos</th>
              <th>Devolvidos</th>
              <th>Em Uso</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.report.forEach(equipment => {
        html += `
          <tr>
            <td>${equipment.id}</td>
            <td>${equipment.name}</td>
            <td>${equipment.total_loans || 0}</td>
            <td>${equipment.returned || 0}</td>
            <td>${equipment.borrowed || 0}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      tableContainer.innerHTML = html;
    } catch (err) {
      console.error('Erro:', err);
      this.showMessage('Erro ao carregar relatório', 'error');
    }
  },

  // Carregar relatório de histórico de empréstimos
  async loadLoansHistoryReport() {
    try {
      const response = await fetch('/api/reports/loans-history');
      const data = await response.json();

      if (!data.success) {
        this.showMessage('Erro ao carregar relatório', 'error');
        return;
      }

      const container = document.getElementById('loansHistoryTable');

      if (data.history.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum empréstimo registrado</p></div>';
        return;
      }

      let html = `
        <table class="report-table">
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
        const loanDate = new Date(loan.loan_date).toLocaleDateString('pt-BR');
        const returnDate = loan.return_date ? new Date(loan.return_date).toLocaleDateString('pt-BR') : '-';

        html += `
          <tr>
            <td>${loan.id}</td>
            <td>${loan.equipment_name}</td>
            <td>${loan.username}</td>
            <td>${loanDate}</td>
            <td>${returnDate}</td>
            <td>${loan.status}</td>
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
      this.showMessage('Erro ao carregar relatório', 'error');
    }
  },

  // Carregar relatório de empréstimos atrasados
  async loadOverdueLoansReport() {
    try {
      const response = await fetch('/api/reports/overdue-loans');
      const data = await response.json();

      if (!data.success) {
        this.showMessage('Erro ao carregar relatório', 'error');
        return;
      }

      const container = document.getElementById('overdueLoansTable');

      if (data.overdue.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum empréstimo atrasado</p></div>';
        return;
      }

      let html = `
        <table class="report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Equipamento</th>
              <th>Usuário</th>
              <th>Email</th>
              <th>Data Empréstimo</th>
              <th>Dias em Atraso</th>
            </tr>
          </thead>
          <tbody>
      `;

      const today = new Date();

      data.overdue.forEach(loan => {
        const loanDate = new Date(loan.loan_date);
        const daysOverdue = Math.floor((today - loanDate) / (1000 * 60 * 60 * 24));
        const formattedDate = loanDate.toLocaleDateString('pt-BR');

        html += `
          <tr>
            <td>${loan.id}</td>
            <td>${loan.equipment_name}</td>
            <td>${loan.username}</td>
            <td>${loan.email}</td>
            <td>${formattedDate}</td>
            <td><strong>${daysOverdue}</strong></td>
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
      this.showMessage('Erro ao carregar relatório', 'error');
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
  ReportSystem.init();
});
