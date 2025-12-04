// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  doc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  LayoutDashboard, Facebook, ShoppingBag, CreditCard, 
  Plus, Trash2, ArrowRight, ArrowLeft, 
  CheckCircle, AlertTriangle, XCircle, ExternalLink, MessageCircle, Lock, User, LogOut,
  Palette, Link as LinkIcon, Rocket, Flag
} from 'lucide-react';

// --- CONFIGURAÇÃO DO SEU BANCO DE DADOS ---
const MINHA_CONFIGURACAO_FIREBASE = {
  apiKey: "AIzaSyChXgx1v7mYr8YGgHoAgE08Wn4yKFzohv0",
  authDomain: "dropcommand-6f9be.firebaseapp.com",
  projectId: "dropcommand-6f9be",
  storageBucket: "dropcommand-6f9be.firebasestorage.app",
  messagingSenderId: "913586544658",
  appId: "1:913586544658:web:f4087266ad0242e2d138cb",
  measurementId: "G-G0PKJEXWVB"
};

// --- LÓGICA DE INICIALIZAÇÃO ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : MINHA_CONFIGURACAO_FIREBASE;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- COMPONENTES UI ---

const CardStat = ({ title, value, subtext, icon: Icon, colorClass, bgClass }: any) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className={`${bgClass} p-2 rounded-lg h-10 w-10 flex items-center justify-center ${colorClass}`}>
        <Icon size={20} />
      </div>
    </div>
    <span className={`text-xs mt-2 block ${colorClass}`}>{subtext}</span>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

export default function App() {
  // --- ESTADOS DE LOGIN ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- ESTADOS DO SISTEMA ---
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  
  // Listas de dados
  const [profiles, setProfiles] = useState([]);
  const [stores, setStores] = useState([]);
  const [pages, setPages] = useState([]); // Nova lista para Páginas
  const [financials, setFinancials] = useState([]);
  
  // Modais e Forms
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false); // Modal para Páginas
  const [newItemName, setNewItemName] = useState('');
  const [newItemExtra, setNewItemExtra] = useState(''); 

  // --- AUTENTICAÇÃO FIREBASE ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        // @ts-ignore
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- CARREGAMENTO DE DADOS (SÓ RODA SE TIVER LOGADO NO FIREBASE) ---
  useEffect(() => {
    if (!user) return;

    const unsubProfiles = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'profiles'), (snap) => {
      setProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Erro ao ler perfis:", error));

    const unsubStores = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'stores'), (snap) => {
      setStores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Erro ao ler lojas:", error));

    // Novo Listener para Páginas
    const unsubPages = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'pages'), (snap) => {
      setPages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Erro ao ler páginas:", error));

    const unsubFin = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'financials'), (snap) => {
      setFinancials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Erro ao ler financeiros:", error));

    return () => { unsubProfiles(); unsubStores(); unsubPages(); unsubFin(); };
  }, [user]);

  // --- FUNÇÃO DE LOGIN DO SISTEMA (ADMIN/1313) ---
  const handleSystemLogin = (e) => {
    e.preventDefault();
    if (loginUser === 'admin' && loginPass === '1313') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Usuário ou senha incorretos');
    }
  };

  // --- FUNÇÃO DE LOGOUT ---
  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginUser('');
    setLoginPass('');
  };

  // --- AÇÕES DO BANCO DE DADOS ---

  const handleAddProfile = async () => {
    if (!newItemName || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'profiles'), {
        name: newItemName,
        login: newItemExtra || 'Sem login',
        phase: 0, 
        status: 'active',
        createdAt: new Date().toISOString()
      });
      setNewItemName(''); setNewItemExtra(''); setIsProfileModalOpen(false);
    } catch (error) {
      alert("Erro ao salvar. Verifique o console.");
      console.error(error);
    }
  };

  const handleAddStore = async () => {
    if (!newItemName || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'stores'), {
        name: newItemName,
        url: newItemExtra || 'https://',
        salesToday: 0,
        phase: 0,
        status: 'online',
        createdAt: new Date().toISOString()
      });
      setNewItemName(''); setNewItemExtra(''); setIsStoreModalOpen(false);
    } catch (error) {
      alert("Erro ao salvar loja.");
      console.error(error);
    }
  };

  // NOVA FUNÇÃO: Adicionar Página
  const handleAddPage = async () => {
    if (!newItemName || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'pages'), {
        name: newItemName,
        link: newItemExtra || 'Sem link',
        phase: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      setNewItemName(''); setNewItemExtra(''); setIsPageModalOpen(false);
    } catch (error) {
      alert("Erro ao salvar página.");
      console.error(error);
    }
  };

  const updateProfilePhase = async (profile, direction) => {
    const newPhase = profile.phase + direction;
    if (newPhase < 0 || newPhase > 4) return;
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profiles', profile.id), {
      phase: newPhase
    });
  };

  const updateStorePhase = async (store, direction) => {
    const currentPhase = store.phase || 0;
    const newPhase = currentPhase + direction;
    if (newPhase < 0 || newPhase > 4) return;
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'stores', store.id), {
      phase: newPhase
    });
  };

  // NOVA FUNÇÃO: Atualizar fase da página
  const updatePagePhase = async (page, direction) => {
    const currentPhase = page.phase || 0;
    const newPhase = currentPhase + direction;
    if (newPhase < 0 || newPhase > 4) return;
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'pages', page.id), {
      phase: newPhase
    });
  };

  const toggleBlockProfile = async (profile) => {
    const newStatus = profile.status === 'blocked' ? 'active' : 'blocked';
    const newPhase = newStatus === 'blocked' ? 4 : 0;
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profiles', profile.id), {
      status: newStatus,
      phase: newPhase
    });
  };

  const deleteItem = async (collectionName, id) => {
    if (!user) return;
    if (confirm('Tem certeza que deseja excluir?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, collectionName, id));
    }
  };

  // --- CÁLCULOS DO DASHBOARD ---
  const totalSales = stores.reduce((acc, store) => acc + (store.salesToday || 0), 0);
  const activeProfiles = profiles.filter(p => p.phase === 3).length;
  const warmingProfiles = profiles.filter(p => p.phase > 0 && p.phase < 3).length;
  const blockedProfiles = profiles.filter(p => p.phase === 4).length;

  // --- FASES ---
  const KANBAN_PHASES_PROFILES = [
    { id: 0, title: '📥 Em Repouso', color: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-400' },
    { id: 1, title: '🔥 Aquecimento (Dia 1-3)', color: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-500' },
    { id: 2, title: '🚀 Maturação (Dia 4-7)', color: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-500' },
    { id: 3, title: '💸 Ativos (Anunciando)', color: 'bg-green-50', text: 'text-green-800', border: 'border-green-500' },
    { id: 4, title: '💀 Bloqueados', color: 'bg-red-50', text: 'text-red-800', border: 'border-red-500' },
  ];

  const KANBAN_PHASES_STORES = [
    { id: 0, title: '🏗️ Configuração Inicial', color: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-400' },
    { id: 1, title: '🎨 Design & Produtos', color: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-500' },
    { id: 2, title: '🔗 Gateway & Pixels', color: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-500' },
    { id: 3, title: '🔥 Aquecimento (Tráfego)', color: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-500' },
    { id: 4, title: '🚀 Escala (Vendas)', color: 'bg-green-50', text: 'text-green-800', border: 'border-green-500' },
  ];

  // NOVA: Fases das Páginas
  const KANBAN_PHASES_PAGES = [
    { id: 0, title: '🆕 Criação & Config', color: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-400' },
    { id: 1, title: '📝 Conteúdo (3-5 Posts)', color: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-500' },
    { id: 2, title: '👍 Engajamento (Curtidas)', color: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-500' },
    { id: 3, title: '🕰️ Maturação (7d+)', color: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-500' },
    { id: 4, title: '📢 Pronta p/ Anúncio', color: 'bg-green-50', text: 'text-green-800', border: 'border-green-500' },
  ];

  // --- TELA DE LOGIN (RENDERIZAÇÃO FORÇADA NO TOPO) ---
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[9999] flex h-screen w-screen bg-slate-900 items-center justify-center p-4">
        <form onSubmit={handleSystemLogin} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
              <LayoutDashboard className="text-blue-600" /> DropCmd
            </h1>
            <p className="text-gray-500 text-sm mt-1">Acesso Restrito</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded flex items-center gap-2">
              <AlertTriangle size={16} /> {loginError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                  placeholder="admin"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                  placeholder="••••"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors shadow-lg"
            >
              Entrar no Sistema
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- TELA PRINCIPAL (DASHBOARD) ---
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
            <LayoutDashboard size={24} /> DropCmd
          </h1>
          <p className="text-xs text-gray-400 mt-1">Gestão Integrada v2.1</p>
        </div>
        
        {/* MENU DE NAVEGAÇÃO */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'contingencia', label: 'Contingência FB', icon: Facebook },
            { id: 'pages', label: 'Páginas FB', icon: Flag }, // NOVO ITEM
            { id: 'lojas', label: 'Lojas & Vendas', icon: ShoppingBag },
            { id: 'cartoes', label: 'Cartões & Proxies', icon: CreditCard },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === item.id 
                  ? 'bg-slate-800 text-white border-l-4 border-blue-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* LINK DE SUPORTE E LOGOUT */}
        <div className="p-4 border-t border-slate-800 space-y-2">
           <a 
             href="https://google.com" 
             target="_blank" 
             rel="noreferrer"
             className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
           >
              <MessageCircle size={20} />
              <span>Suporte / Ajuda</span>
           </a>
           
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
           >
              <LogOut size={20} />
              <span>Sair do Sistema</span>
           </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-auto p-8">
        
        {/* VIEW: DASHBOARD */}
        {activeView === 'dashboard' && (
          <div className="animate-in fade-in duration-300">
            <header className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
                <p className="text-gray-500">Resumo da operação hoje</p>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"
              >
                <Plus size={18} /> Ação Rápida
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <CardStat 
                title="Vendas Hoje (Est.)" 
                value={`R$ ${totalSales.toFixed(2)}`} 
                subtext="Soma manual das lojas"
                icon={ShoppingBag} 
                colorClass="text-green-600" 
                bgClass="bg-green-100" 
              />
              <CardStat 
                title="Perfis Ativos" 
                value={`${activeProfiles} / ${profiles.length}`} 
                subtext={`${warmingProfiles} em aquecimento`}
                icon={Facebook} 
                colorClass="text-blue-600" 
                bgClass="bg-blue-100" 
              />
              <CardStat 
                title="Lojas Monitoradas" 
                value={stores.length} 
                subtext="Lojas cadastradas"
                icon={ShoppingBag} 
                colorClass="text-purple-600" 
                bgClass="bg-purple-100" 
              />
              <CardStat 
                title="Bloqueios" 
                value={blockedProfiles} 
                subtext="Necessitam atenção"
                icon={AlertTriangle} 
                colorClass="text-red-500" 
                bgClass="bg-red-100" 
              />
            </div>
            
            {/* Tabela Resumo Recente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">Últimos Perfis Adicionados</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Nome</th>
                      <th className="px-4 py-3">Fase</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.slice(0, 5).map(p => (
                      <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            p.phase === 4 ? 'bg-red-100 text-red-700' : 
                            p.phase === 3 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {KANBAN_PHASES_PROFILES[p.phase]?.title.split(' ')[1]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setActiveView('contingencia')} className="text-blue-500 hover:underline">Gerenciar</button>
                        </td>
                      </tr>
                    ))}
                    {profiles.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-400">Nenhum perfil cadastrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CONTINGÊNCIA (KANBAN DE PERFIS) */}
        {activeView === 'contingencia' && (
          <div className="h-full flex flex-col animate-in fade-in duration-300">
            <header className="flex justify-between items-center mb-6 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Esteira de Aquecimento</h2>
                <p className="text-gray-500">Mova os cards conforme o perfil evolui</p>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"
              >
                <Plus size={18} /> Novo Perfil
              </button>
            </header>

            {/* Kanban Board Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
              <div className="flex gap-6 h-full min-w-[1200px]">
                {KANBAN_PHASES_PROFILES.map((phase) => (
                  <div key={phase.id} className="w-72 flex flex-col flex-shrink-0 h-full">
                    {/* Header Coluna */}
                    <div className={`p-3 rounded-t-lg font-bold flex justify-between items-center ${phase.color.replace('50', '200')} ${phase.text}`}>
                      <span className="text-sm truncate">{phase.title}</span>
                      <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                        {profiles.filter(p => p.phase === phase.id).length}
                      </span>
                    </div>
                    
                    {/* Área de Cards */}
                    <div className={`flex-1 p-2 rounded-b-lg ${phase.color} border border-t-0 border-gray-200 overflow-y-auto space-y-3`}>
                      {profiles.filter(p => p.phase === phase.id).map(profile => (
                        <div key={profile.id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${phase.border} hover:shadow-md transition group relative`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm text-gray-800 truncate" title={profile.name}>{profile.name}</h4>
                            <button onClick={() => deleteItem('profiles', profile.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          <p className="text-xs text-gray-500 mb-3 truncate">Login: {profile.login}</p>
                          
                          {/* Controles do Card */}
                          <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                            <button 
                              disabled={phase.id === 0}
                              onClick={() => updateProfilePhase(profile, -1)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                              title="Voltar fase"
                            >
                              <ArrowLeft size={14} />
                            </button>
                            
                            {/* Botão de Bloqueio/Desbloqueio */}
                            <button 
                              onClick={() => toggleBlockProfile(profile)}
                              className={`text-xs px-2 py-1 rounded font-bold ${
                                profile.status === 'blocked' 
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                              title={profile.status === 'blocked' ? 'Desbloquear' : 'Marcar como Bloqueado'}
                            >
                              {profile.status === 'blocked' ? 'BLOQUEADO' : <AlertTriangle size={14} />}
                            </button>

                            <button 
                              disabled={phase.id === 4}
                              onClick={() => updateProfilePhase(profile, 1)}
                              className="p-1 rounded hover:bg-gray-100 text-blue-500 disabled:opacity-30"
                              title="Avançar fase"
                            >
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: PÁGINAS FB (KANBAN NOVO) */}
        {activeView === 'pages' && (
          <div className="h-full flex flex-col animate-in fade-in duration-300">
            <header className="flex justify-between items-center mb-6 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Esteira de Fanpages</h2>
                <p className="text-gray-500">Mova as páginas conforme engajamento</p>
              </div>
              <button 
                onClick={() => setIsPageModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"
              >
                <Plus size={18} /> Nova Página
              </button>
            </header>

            {/* Kanban Board Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
              <div className="flex gap-6 h-full min-w-[1200px]">
                {KANBAN_PHASES_PAGES.map((phase) => (
                  <div key={phase.id} className="w-72 flex flex-col flex-shrink-0 h-full">
                    {/* Header Coluna */}
                    <div className={`p-3 rounded-t-lg font-bold flex justify-between items-center ${phase.color.replace('50', '200')} ${phase.text}`}>
                      <span className="text-sm truncate">{phase.title}</span>
                      <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                        {pages.filter(p => (p.phase || 0) === phase.id).length}
                      </span>
                    </div>
                    
                    {/* Área de Cards */}
                    <div className={`flex-1 p-2 rounded-b-lg ${phase.color} border border-t-0 border-gray-200 overflow-y-auto space-y-3`}>
                      {pages.filter(p => (p.phase || 0) === phase.id).map(page => (
                        <div key={page.id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${phase.border} hover:shadow-md transition group relative`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm text-gray-800 truncate" title={page.name}>{page.name}</h4>
                            <button onClick={() => deleteItem('pages', page.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          <p className="text-xs text-gray-500 mb-3 truncate">Link: {page.link}</p>
                          
                          {/* Controles do Card */}
                          <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                            <button 
                              disabled={phase.id === 0}
                              onClick={() => updatePagePhase(page, -1)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                              title="Voltar fase"
                            >
                              <ArrowLeft size={14} />
                            </button>
                            
                            <span className="text-xs text-gray-400 font-medium">Fase {phase.id + 1}</span>

                            <button 
                              disabled={phase.id === 4}
                              onClick={() => updatePagePhase(page, 1)}
                              className="p-1 rounded hover:bg-gray-100 text-blue-500 disabled:opacity-30"
                              title="Avançar fase"
                            >
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: LOJAS (KANBAN DE LOJAS) - NOVA IMPLEMENTAÇÃO */}
        {activeView === 'lojas' && (
          <div className="h-full flex flex-col animate-in fade-in duration-300">
             <header className="flex justify-between items-center mb-6 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Esteira de Lojas</h2>
                <p className="text-gray-500">Gestão de links, vendas e maturação da loja</p>
              </div>
              <button 
                onClick={() => setIsStoreModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"
              >
                <Plus size={18} /> Nova Loja
              </button>
            </header>

            {/* Kanban Board Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
              <div className="flex gap-6 h-full min-w-[1200px]">
                {KANBAN_PHASES_STORES.map((phase) => (
                  <div key={phase.id} className="w-72 flex flex-col flex-shrink-0 h-full">
                    {/* Header Coluna */}
                    <div className={`p-3 rounded-t-lg font-bold flex justify-between items-center ${phase.color.replace('50', '200')} ${phase.text}`}>
                      <span className="text-sm truncate">{phase.title}</span>
                      <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                        {stores.filter(s => (s.phase || 0) === phase.id).length}
                      </span>
                    </div>
                    
                    {/* Área de Cards */}
                    <div className={`flex-1 p-2 rounded-b-lg ${phase.color} border border-t-0 border-gray-200 overflow-y-auto space-y-3`}>
                      {stores.filter(s => (s.phase || 0) === phase.id).map(store => (
                        <div key={store.id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${phase.border} hover:shadow-md transition group relative`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm text-gray-800 truncate w-32" title={store.name}>{store.name}</h4>
                            <button onClick={() => deleteItem('stores', store.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          <a href={store.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mb-3 truncate">
                            <LinkIcon size={10} /> {store.url}
                          </a>

                          {/* Campo de Vendas dentro do Card */}
                          <div className="bg-gray-50 p-2 rounded border border-gray-100 mb-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Vendas Hoje</p>
                            <input 
                              type="number" 
                              className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-gray-200 focus:border-purple-500 outline-none" 
                              value={store.salesToday || 0}
                              placeholder="0.00"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!user) return;
                                updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'stores', store.id), { salesToday: val });
                              }}
                           />
                          </div>
                          
                          {/* Controles do Card */}
                          <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                            <button 
                              disabled={phase.id === 0}
                              onClick={() => updateStorePhase(store, -1)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                              title="Voltar fase"
                            >
                              <ArrowLeft size={14} />
                            </button>
                            
                            <span className="text-xs text-gray-400 font-medium">Fase {phase.id + 1}</span>

                            <button 
                              disabled={phase.id === 4}
                              onClick={() => updateStorePhase(store, 1)}
                              className="p-1 rounded hover:bg-gray-100 text-purple-500 disabled:opacity-30"
                              title="Avançar fase"
                            >
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CARTÕES (Simples) */}
        {activeView === 'cartoes' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Em Desenvolvimento</h2>
            <div className="p-8 bg-white rounded-xl border border-dashed border-gray-300 text-center">
              <p className="text-gray-500">O módulo de cartões e proxies será implementado na próxima etapa.</p>
            </div>
          </div>
        )}

      </main>

      {/* MODALS */}
      <Modal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        title="Novo Perfil de Contingência"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Perfil</label>
            <input 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
              placeholder="Ex: Mark Zuckerberg 01"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Login / Email</label>
            <input 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
              placeholder="Ex: mark@fb.com"
              value={newItemExtra}
              onChange={e => setNewItemExtra(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddProfile}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
          >
            Criar Perfil
          </button>
        </div>
      </Modal>

      {/* NOVO MODAL: PAGINAS */}
      <Modal 
        isOpen={isPageModalOpen} 
        onClose={() => setIsPageModalOpen(false)} 
        title="Nova Página do Facebook"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Página</label>
            <input 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
              placeholder="Ex: Ofertas Imperdíveis"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link da Página (Opcional)</label>
            <input 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
              placeholder="Ex: facebook.com/minhapagina"
              value={newItemExtra}
              onChange={e => setNewItemExtra(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddPage}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
          >
            Adicionar Página
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isStoreModalOpen} 
        onClose={() => setIsStoreModalOpen(false)} 
        title="Nova Loja Shopify"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
            <input 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900"
              placeholder="Ex: Minha Loja Top"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL (Link)</label>
            <input 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900"
              placeholder="Ex: https://minhaloja.com"
              value={newItemExtra}
              onChange={e => setNewItemExtra(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddStore}
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-medium"
          >
            Adicionar Loja
          </button>
        </div>
      </Modal>

    </div>
  );
}