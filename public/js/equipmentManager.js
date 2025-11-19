// ===== SISTEMA DE GESTÃO DE EQUIPAMENTOS =====

const EquipmentManager = {
  currentUser: null,
  equipments: [],

  // Inicializar o sistema
  async init() {
    await this.checkAuth();
    if (!this.currentUser) {
      window.location.href = '/login';
      return;
    }
    
    this.setupEventListeners();
    await this.loadEquipments();
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

  // Carregar equipamentos do servidor
  async loadEquipments() {
    try {
      const response = await fetch('/api/equipments');
      const data = await response.json();
      
      if (data.success) {
        this.equipments = data.equipments;
        this.renderEquipments();
      } else {
        this.showMessage('Erro ao carregar equipamentos', 'error');
      }
    } catch (err) {
      console.error('Erro ao carregar equipamentos:', err);
      this.showMessage('Erro ao carregar equipamentos', 'error');
    }
  },

  // Renderizar lista de equipamentos
  renderEquipments() {
    const container = document.getElementById('equipmentList');
    if (!container) return;

    if (this.equipments.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Nenhum equipamento cadastrado</p>
          ${this.currentUser.role !== 'aluno' ? '<p>Clique em "Adicionar Equipamento" para criar um novo registro</p>' : ''}
        </div>
      `;
      return;
    }

    let html = `
      <table class="equip-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Série</th>
            <th>Localização</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
    `;

    this.equipments.forEach(equipment => {
      const statusClass = this.getStatusClass(equipment.status);
      let actions = '';

      if (this.currentUser.role === 'aluno') {
        if (equipment.status === 'Disponível') {
          actions = `<button class="btn-small btn-borrow" onclick="EquipmentManager.openBorrowModal(${equipment.id})">Emprestar</button>`;
        }
      } else if (this.currentUser.role === 'pedagogico' || this.currentUser.role === 'admin') {
        actions = `
          <button class="btn-small btn-edit" onclick="EquipmentManager.openEditModal(${equipment.id})">Editar</button>
        `;
        if (this.currentUser.role === 'admin') {
          actions += `<button class="btn-small btn-delete" onclick="EquipmentManager.deleteEquipment(${equipment.id})">Deletar</button>`;
        }
      }

      html += `
        <tr>
          <td>${equipment.id}</td>
          <td>${equipment.name}</td>
          <td>${equipment.serial_number || '-'}</td>
          <td>${equipment.location}</td>
          <td><span class="status-badge ${statusClass}">${equipment.status}</span></td>
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

  // Obter classe CSS do status
  getStatusClass(status) {
    switch(status) {
      case 'Disponível': return 'status-disponivel';
      case 'Emprestado': return 'status-emprestado';
      case 'Manutenção': return 'status-manutencao';
      default: return 'status-disponivel';
    }
  },

  // Configurar event listeners
  setupEventListeners() {
    // Botão adicionar
    const btnAdd = document.getElementById('btnAdd');
    if (btnAdd) {
      if (this.currentUser.role === 'aluno') {
        btnAdd.style.display = 'none';
      } else {
        btnAdd.addEventListener('click', () => this.openAddModal());
      }
    }

    // Busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterEquipments(e.target.value));
    }

    // Modais
    const closeEquipmentModal = document.getElementById('closeEquipmentModal');
    if (closeEquipmentModal) {
      closeEquipmentModal.addEventListener('click', () => this.closeModal('equipmentModal'));
    }

    const closeBorrowModal = document.getElementById('closeBorrowModal');
    if (closeBorrowModal) {
      closeBorrowModal.addEventListener('click', () => this.closeModal('borrowModal'));
    }

    // Formulários
    const equipmentForm = document.getElementById('equipmentForm');
    if (equipmentForm) {
      equipmentForm.addEventListener('submit', (e) => this.handleEquipmentSubmit(e));
    }

    const borrowForm = document.getElementById('borrowForm');
    if (borrowForm) {
      borrowForm.addEventListener('submit', (e) => this.handleBorrowSubmit(e));
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
      const equipmentModal = document.getElementById('equipmentModal');
      const borrowModal = document.getElementById('borrowModal');
      
      if (e.target === equipmentModal) this.closeModal('equipmentModal');
      if (e.target === borrowModal) this.closeModal('borrowModal');
    });
  },

  // Filtrar equipamentos
  filterEquipments(searchTerm) {
    const filtered = this.equipments.filter(eq => 
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.serial_number && eq.serial_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const container = document.getElementById('equipmentList');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Nenhum equipamento encontrado</p></div>';
      return;
    }

    // Renderizar apenas os filtrados
    const tempEquipments = this.equipments;
    this.equipments = filtered;
    this.renderEquipments();
    this.equipments = tempEquipments;
  },

  // Abrir modal de adicionar
  openAddModal() {
    const modal = document.getElementById('equipmentModal');
    document.getElementById('modalTitle').textContent = 'Novo Equipamento';
    document.getElementById('equipmentId').value = '';
    document.getElementById('equipmentForm').reset();
    modal.style.display = 'block';
  },

  // Abrir modal de editar
  openEditModal(id) {
    const equipment = this.equipments.find(e => e.id === id);
    if (!equipment) return;

    const modal = document.getElementById('equipmentModal');
    document.getElementById('modalTitle').textContent = 'Editar Equipamento';
    document.getElementById('equipmentId').value = equipment.id;
    document.getElementById('equipmentName').value = equipment.name;
    document.getElementById('equipmentSerial').value = equipment.serial_number || '';
    document.getElementById('equipmentDescription').value = equipment.description || '';
    document.getElementById('equipmentLocation').value = equipment.location;
    document.getElementById('equipmentStatus').value = equipment.status;
    modal.style.display = 'block';
  },

  // Abrir modal de empréstimo
  openBorrowModal(id) {
    const equipment = this.equipments.find(e => e.id === id);
    if (!equipment) return;

    document.getElementById('borrowEquipmentId').value = equipment.id;
    document.getElementById('borrowEquipmentName').textContent = `Equipamento: ${equipment.name}`;
    document.getElementById('borrowModal').style.display = 'block';
  },

  // Fechar modal
  closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  },

  // Lidar com envio do formulário de equipamento
  async handleEquipmentSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('equipmentId').value;
    const name = document.getElementById('equipmentName').value;
    const serial_number = document.getElementById('equipmentSerial').value;
    const description = document.getElementById('equipmentDescription').value;
    const location = document.getElementById('equipmentLocation').value;
    const status = document.getElementById('equipmentStatus').value;

    const data = { name, description, location, status };
    if (serial_number) data.serial_number = serial_number;

    try {
      let response;
      if (id) {
        // Editar
        response = await fetch(`/api/equipments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        // Criar
        response = await fetch('/api/equipments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }

      const result = await response.json();
      if (result.success) {
        this.showMessage(result.message, 'success');
        this.closeModal('equipmentModal');
        await this.loadEquipments();
      } else {
        this.showMessage(result.message, 'error');
      }
    } catch (err) {
      console.error('Erro:', err);
      this.showMessage('Erro ao salvar equipamento', 'error');
    }
  },

  // Lidar com envio do formulário de empréstimo
  async handleBorrowSubmit(e) {
    e.preventDefault();

    const equipmentId = document.getElementById('borrowEquipmentId').value;

    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipment_id: parseInt(equipmentId) })
      });

      const result = await response.json();
      if (result.success) {
        this.showMessage('Empréstimo solicitado com sucesso!', 'success');
        this.closeModal('borrowModal');
        await this.loadEquipments();
      } else {
        this.showMessage(result.message, 'error');
      }
    } catch (err) {
      console.error('Erro:', err);
      this.showMessage('Erro ao solicitar empréstimo', 'error');
    }
  },

  // Deletar equipamento
  async deleteEquipment(id) {
    if (!confirm('Tem certeza que deseja deletar este equipamento?')) return;

    try {
      const response = await fetch(`/api/equipments/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        this.showMessage('Equipamento deletado com sucesso!', 'success');
        await this.loadEquipments();
      } else {
        this.showMessage(result.message, 'error');
      }
    } catch (err) {
      console.error('Erro:', err);
      this.showMessage('Erro ao deletar equipamento', 'error');
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
  EquipmentManager.init();
});
