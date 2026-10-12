import React, { useState, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  Shield,
  Percent,
  CheckCircle,
  Edit2,
  Trash2,
  Lock,
  Mail,
  Phone,
  UserCheck,
  UserX,
  AlertCircle,
  X,
  KeyRound,
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
  Palette,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVidracaria } from '../../context/VidracariaContext';
import { User, UserRoleType } from '../../types';

const ROLE_INFO: Record<
  UserRoleType,
  { label: string; defaultDiscount: number; badgeColor: string; description: string }
> = {
  ADMINISTRADOR: {
    label: 'Administrador',
    defaultDiscount: 100,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Acesso irrestrito a todos os módulos, relatórios, cadastros e alçada total (100%).',
  },
  GERENTE: {
    label: 'Gerente Comercial',
    defaultDiscount: 10,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Gestão de equipe, aprovação de orçamentos e alçada de desconto de até 10%.',
  },
  VENDEDOR: {
    label: 'Vendedor / Balcão',
    defaultDiscount: 5,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Emissão de orçamentos, pedidos e atendimento a clientes (alçada máx. 5%).',
  },
  ESTOQUISTA: {
    label: 'Estoquista',
    defaultDiscount: 0,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Gestão de entradas, saídas, perdas e inventário de chapas e ferragens.',
  },
  PRODUCAO: {
    label: 'Operador de Produção',
    defaultDiscount: 0,
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    description: 'Apontamento técnico das etapas de corte, beneficiamento, montagem e instalação.',
  },
  FINANCEIRO: {
    label: 'Analista Financeiro',
    defaultDiscount: 0,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Controle de contas a receber, liquidação de parcelas e extrato de comissões.',
  },
};

// Avatares com Desenhos / Ilustrações (Vector/Cartoon amigáveis e modernos)
const ILLUSTRATED_AVATARS = [
  {
    name: 'Carlos (Executivo)',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Carlos&backgroundColor=b6e3f4',
  },
  {
    name: 'Mariana (Gerente)',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Mariana&backgroundColor=ffd5dc',
  },
  {
    name: 'Lucas (Comercial)',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Lucas&backgroundColor=c0aede',
  },
  {
    name: 'Rodrigo (Técnico)',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Rodrigo&backgroundColor=d1d4f9',
  },
  {
    name: 'Beatriz (Finanças)',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Beatriz&backgroundColor=ffdfbf',
  },
  {
    name: 'Jorge (Fábrica)',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Jorge&backgroundColor=dbeafe',
  },
  {
    name: 'Desenho Felix',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4',
  },
  {
    name: 'Desenho Aneka',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=ffd5dc',
  },
  {
    name: 'Desenho Milo',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=d1d4f9',
  },
  {
    name: 'Desenho Zoe',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=ffdfbf',
  },
  {
    name: 'Notionist Oliver',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Oliver&backgroundColor=e2e8f0',
  },
  {
    name: 'Notionist Sophia',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sophia&backgroundColor=fce7f3',
  },
  {
    name: 'Notionist Arthur',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Arthur&backgroundColor=dbeafe',
  },
  {
    name: 'Notionist Emma',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Emma&backgroundColor=fef3c7',
  },
  {
    name: 'Robô Industrial',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=VidroFabrica&backgroundColor=e0f2fe',
  },
  {
    name: 'Robô Operacional',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TechVidro&backgroundColor=f3e8ff',
  },
];

// Fotos Reais Opcionais
const REAL_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

export const UsersView: React.FC = () => {
  const { allUsers, currentUser, switchUser, createUser, updateUser, deleteUser } = useAuth();
  const { recordAuditLog } = useVidracaria();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('TODOS');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVOS' | 'INATIVOS'>('TODOS');

  // Modal Estado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Campos do Formulário
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRoleType>('VENDEDOR');
  const [formMaxDiscount, setFormMaxDiscount] = useState<number>(5);
  const [formPassword, setFormPassword] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Aba selecionada para avatar no modal: 'DESENHOS' | 'UPLOAD' | 'FOTOS' | 'URL'
  const [avatarTab, setAvatarTab] = useState<'DESENHOS' | 'UPLOAD' | 'FOTOS' | 'URL'>('DESENHOS');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal de Confirmação de Exclusão
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filtragem
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchesRole = roleFilter === 'TODOS' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'TODOS' ||
      (statusFilter === 'ATIVOS' && u.isActive) ||
      (statusFilter === 'INATIVOS' && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('VENDEDOR');
    setFormMaxDiscount(ROLE_INFO['VENDEDOR'].defaultDiscount);
    setFormPassword('123456');
    setFormAvatarUrl(ILLUSTRATED_AVATARS[0].url);
    setAvatarTab('DESENHOS');
    setFormIsActive(true);
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormMaxDiscount(user.maxDiscountPercent);
    setFormPassword(user.password || '');
    setFormAvatarUrl(user.avatarUrl || ILLUSTRATED_AVATARS[0].url);
    // Se o avatar for data URL (upload), abre na aba de upload
    if (user.avatarUrl?.startsWith('data:image')) {
      setAvatarTab('UPLOAD');
    } else {
      setAvatarTab('DESENHOS');
    }
    setFormIsActive(user.isActive);
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRoleType) => {
    setFormRole(newRole);
    setFormMaxDiscount(ROLE_INFO[newRole].defaultDiscount);
  };

  // Upload e Redimensionamento Local com HTML5 Canvas
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setActionError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }

    setIsUploading(true);
    setActionError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const targetSize = 200; // Tamanho ideal para avatar em alta nitidez e leve
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            // Recorte centralizado quadrado proporcional
            const minDim = Math.min(img.width, img.height);
            const startX = (img.width - minDim) / 2;
            const startY = (img.height - minDim) / 2;

            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            setFormAvatarUrl(optimizedDataUrl);
            setAvatarTab('UPLOAD');
          }
        } catch (err) {
          console.error(err);
          setActionError('Não foi possível processar a imagem selecionada.');
        } finally {
          setIsUploading(false);
        }
      };
      img.onerror = () => {
        setIsUploading(false);
        setActionError('Erro ao carregar a imagem.');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setIsUploading(false);
      setActionError('Erro ao ler o arquivo do dispositivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!formName.trim() || !formEmail.trim()) {
      setActionError('Nome e E-mail são obrigatórios.');
      return;
    }

    const emailConflict = allUsers.find(
      (u) => u.email.toLowerCase() === formEmail.trim().toLowerCase() && u.id !== editingUserId
    );
    if (emailConflict) {
      setActionError('Já existe um usuário cadastrado com este e-mail.');
      return;
    }

    if (formMaxDiscount < 0 || formMaxDiscount > 100) {
      setActionError('A alçada máxima de desconto deve estar entre 0% e 100%.');
      return;
    }

    const finalAvatar = formAvatarUrl.trim() || ILLUSTRATED_AVATARS[0].url;

    if (editingUserId) {
      // Edição
      updateUser(editingUserId, {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim() || undefined,
        role: formRole,
        maxDiscountPercent: Number(formMaxDiscount),
        password: formPassword.trim() || undefined,
        avatarUrl: finalAvatar,
        isActive: formIsActive,
      });

      recordAuditLog(
        'UPDATE_USER',
        'User',
        editingUserId,
        `Usuário ${formName} atualizado (${formRole}, desconto máx ${formMaxDiscount}%)`
      );

      setActionSuccess(`Usuário ${formName} atualizado com sucesso.`);
    } else {
      // Criação
      const created = createUser({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim() || undefined,
        role: formRole,
        maxDiscountPercent: Number(formMaxDiscount),
        password: formPassword.trim() || '123456',
        avatarUrl: finalAvatar,
        isActive: formIsActive,
      });

      recordAuditLog(
        'CREATE_USER',
        'User',
        created.id,
        `Novo usuário cadastrado: ${formName} (${formRole})`
      );

      setActionSuccess(`Usuário ${formName} cadastrado com sucesso.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleToggleStatus = (user: User) => {
    if (user.id === currentUser.id) {
      alert('Você não pode desativar o seu próprio perfil em uso.');
      return;
    }
    const newStatus = !user.isActive;
    updateUser(user.id, { isActive: newStatus });
    recordAuditLog(
      'UPDATE_USER_STATUS',
      'User',
      user.id,
      `Status do usuário ${user.name} alterado para ${newStatus ? 'ATIVO' : 'INATIVO'}`
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmUser) return;
    const res = deleteUser(deleteConfirmUser.id);
    if (!res.success) {
      alert(res.error);
      setDeleteConfirmUser(null);
      return;
    }

    recordAuditLog(
      'DELETE_USER',
      'User',
      deleteConfirmUser.id,
      `Usuário ${deleteConfirmUser.name} (${deleteConfirmUser.email}) excluído do sistema`
    );

    setActionSuccess(`Usuário ${deleteConfirmUser.name} excluído com sucesso.`);
    setDeleteConfirmUser(null);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const totalUsers = allUsers.length;
  const activeCount = allUsers.filter((u) => u.isActive).length;
  const adminCount = allUsers.filter((u) => u.role === 'ADMINISTRADOR').length;
  const salesCount = allUsers.filter((u) => u.role === 'VENDEDOR' || u.role === 'GERENTE').length;

  return (
    <div className="space-y-6">
      {/* Topo / Título & Botão de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Gestão de Usuários, Papéis & Alçadas (CRUD)</span>
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Cadastre novos colaboradores, configure senhas, fotos ou avatares ilustrados, defina papéis e alçadas
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Mensagens de Sucesso */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total de Usuários</span>
          <p className="text-xl font-black text-slate-900 mt-1">{totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Usuários Ativos</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Administradores</span>
          <p className="text-xl font-black text-purple-600 mt-1">{adminCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Equipe Comercial</span>
          <p className="text-xl font-black text-blue-600 mt-1">{salesCount}</p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 w-full sm:w-auto"
          >
            <option value="TODOS">Todos os Papéis</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="GERENTE">Gerente</option>
            <option value="VENDEDOR">Vendedor</option>
            <option value="ESTOQUISTA">Estoquista</option>
            <option value="PRODUCAO">Produção</option>
            <option value="FINANCEIRO">Financeiro</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 w-full sm:w-auto"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ATIVOS">Apenas Ativos</option>
            <option value="INATIVOS">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Grid de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isCurrent = user.id === currentUser.id;
          const roleData = ROLE_INFO[user.role] || {
            label: user.role,
            defaultDiscount: 0,
            badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
            description: '',
          };

          return (
            <div
              key={user.id}
              className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : user.isActive
                  ? 'border-slate-200 shadow-xs hover:shadow-md'
                  : 'border-slate-200 bg-slate-50/70 opacity-75'
              }`}
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={
                          user.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.name
                          )}&background=0D8ABC&color=fff`
                        }
                        alt={user.name}
                        className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs bg-slate-100"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          user.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                        title={user.isActive ? 'Usuário Ativo' : 'Usuário Inativo'}
                      />
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        {user.name}
                      </h2>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{user.email}</span>
                      </p>
                      {user.phone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          <span>{user.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações de Edição e Exclusão */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      title="Editar Usuário"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmUser(user)}
                      disabled={isCurrent}
                      title={
                        isCurrent
                          ? 'Não é possível excluir o próprio usuário logado'
                          : 'Excluir Usuário'
                      }
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Papel e Alçada */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleData.badgeColor}`}
                    >
                      {roleData.label}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Alçada de Desconto:</span>
                      <span className="font-black text-blue-700">{user.maxDiscountPercent}%</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {roleData.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão de Simulação de Perfil */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                {isCurrent ? (
                  <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl">
                    <CheckCircle className="w-4 h-4" />
                    <span>Perfil Selecionado no Momento</span>
                  </div>
                ) : (
                  <button
                    onClick={() => switchUser(user.id)}
                    className="w-full py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Simular Operação como Este Usuário</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="font-semibold text-sm">Nenhum usuário encontrado</p>
          <p className="text-xs text-slate-400 mt-1">
            Tente ajustar os termos de busca ou filtros de papel e status.
          </p>
        </div>
      )}

      {/* MODAL: NOVO / EDITAR USUÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>{editingUserId ? 'Editar Usuário & Permissões' : 'Cadastrar Novo Usuário'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              {/* SEÇÃO PRINCIPAL DE FOTO / AVATAR */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Foto ou Avatar do Colaborador</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Escolha um desenho ou envie do computador
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview do Avatar Selecionado */}
                  <div className="relative shrink-0 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden ring-3 ring-blue-500/30 shadow-md bg-white flex items-center justify-center">
                      <img
                        src={formAvatarUrl || ILLUSTRATED_AVATARS[0].url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 mt-1">Prévia Atual</span>
                  </div>

                  {/* Abas de Escolha: Desenho / Upload / Fotos / URL */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl text-[11px] font-bold text-slate-600">
                      <button
                        type="button"
                        onClick={() => setAvatarTab('DESENHOS')}
                        className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          avatarTab === 'DESENHOS'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'hover:text-slate-900'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>Avatares com Desenho</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAvatarTab('UPLOAD')}
                        className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          avatarTab === 'UPLOAD'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'hover:text-slate-900'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload de Foto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAvatarTab('FOTOS')}
                        className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          avatarTab === 'FOTOS'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'hover:text-slate-900'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Fotos Reais</span>
                      </button>
                    </div>

                    {/* CONTEÚDO DA ABA: DESENHOS / ILUSTRAÇÕES */}
                    {avatarTab === 'DESENHOS' && (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-8 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                          {ILLUSTRATED_AVATARS.map((avatar, idx) => {
                            const isSelected = formAvatarUrl === avatar.url;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setFormAvatarUrl(avatar.url)}
                                title={avatar.name}
                                className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden ring-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'ring-blue-600 scale-105 shadow-sm'
                                    : 'ring-transparent hover:ring-slate-300 opacity-80 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={avatar.url}
                                  alt={avatar.name}
                                  className="w-full h-full object-cover bg-slate-100"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-500 text-center font-medium">
                          Clique em qualquer desenho ilustrado para selecionar como avatar.
                        </p>
                      </div>
                    )}

                    {/* CONTEÚDO DA ABA: UPLOAD DO COMPUTADOR */}
                    {avatarTab === 'UPLOAD' && (
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className="p-4 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                        >
                          <Upload className="w-5 h-5 text-blue-600" />
                          <p className="text-xs font-bold text-slate-700">
                            {isUploading ? 'Processando imagem...' : 'Clique para escolher foto ou arraste aqui'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            PNG, JPG ou WebP (ajustado e centralizado automaticamente)
                          </span>
                        </div>

                        {formAvatarUrl?.startsWith('data:image') && (
                          <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <span className="flex items-center gap-1 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Foto do dispositivo pronta!
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormAvatarUrl(ILLUSTRATED_AVATARS[0].url);
                                setAvatarTab('DESENHOS');
                              }}
                              className="text-red-600 hover:underline font-bold text-[10px] cursor-pointer"
                            >
                              Remover Foto
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CONTEÚDO DA ABA: FOTOS REAIS PREDEFINIDAS */}
                    {avatarTab === 'FOTOS' && (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-6 gap-2 p-1 bg-white rounded-xl border border-slate-200">
                          {REAL_PHOTO_PRESETS.map((url, idx) => {
                            const isSelected = formAvatarUrl === url;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setFormAvatarUrl(url)}
                                className={`relative w-10 h-10 rounded-xl overflow-hidden ring-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'ring-blue-600 scale-105 shadow-sm'
                                    : 'ring-transparent hover:ring-slate-300 opacity-80 hover:opacity-100'
                                }`}
                              >
                                <img src={url} alt="Foto" className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* DADOS CADASTRAIS DO USUÁRIO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail de Acesso *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="joao@vidracaria.com.br"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone / Celular
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Papel no Sistema (RBAC) *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRoleType)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="ADMINISTRADOR">Administrador (Total)</option>
                    <option value="GERENTE">Gerente Comercial</option>
                    <option value="VENDEDOR">Vendedor / Balcão</option>
                    <option value="ESTOQUISTA">Estoquista</option>
                    <option value="PRODUCAO">Operador de Produção</option>
                    <option value="FINANCEIRO">Analista Financeiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alçada Máx. Desconto (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={formMaxDiscount}
                      onChange={(e) => setFormMaxDiscount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Senha de Acesso {editingUserId && '(Deixe em branco para manter a atual)'}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={editingUserId ? 'Nova senha (opcional)' : 'Senha de acesso (padrão: 123456)'}
                      className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status Ativo/Inativo */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="userActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Conta Ativa (permite login e operações no sistema)
                </label>
              </div>

              {/* Botões do Rodapé do Modal */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                >
                  {editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900">Excluir Usuário</h3>
              <p className="text-xs text-slate-600 mt-1">
                Tem certeza que deseja remover o usuário{' '}
                <strong className="text-slate-900">{deleteConfirmUser.name}</strong>?
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Esta ação remove o acesso do colaborador ao sistema de forma imediata.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="w-1/2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-1/2 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/20 cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
