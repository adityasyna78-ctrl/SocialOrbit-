import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar as CalendarIcon, 
  Sparkles, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Link as LinkIcon,
  FileText,
  Search,
  Bell,
  ChevronDown,
  User,
  MessageSquare,
  Activity,
  Plus,
  CheckSquare
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Badge } from './ui/Badge';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ user, setUser }: { user: any, setUser: any }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await api.get('/clients');
        setClients(data);
        if (data.length > 0) {
          // Try to restore from session storage or default to first
          const savedClientId = sessionStorage.getItem('selectedClientId');
          const savedClient = data.find((c: any) => c.id.toString() === savedClientId);
          setSelectedClient(savedClient || data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch clients', err);
      }
    };
    fetchClients();
  }, []);

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id.toString() === clientId);
    setSelectedClient(client);
    sessionStorage.setItem('selectedClientId', clientId);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
    { name: 'Competitors', path: '/competitors', icon: Activity },
    { name: 'Content Planner', path: '/calendar', icon: CalendarIcon },
    { name: 'AI Tools', path: '/ai-tools', icon: Sparkles },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Integrations', path: '/integrations', icon: LinkIcon },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-bg-light font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#111827] text-white fixed inset-y-0 left-0 z-50">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Social Orbit</h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 mr-3 transition-colors",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-400 rounded-xl hover:bg-danger/10 hover:text-danger transition-all duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-border-light flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex-1 flex items-center gap-4">
            <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Users className="w-4 h-4" />
              </div>
              <select 
                value={selectedClient?.id || ''}
                onChange={(e) => handleClientChange(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8"
              >
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <Badge variant="default" className="hidden md:flex bg-emerald-50 text-emerald-600 border-emerald-100">
              Active Client Context
            </Badge>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-primary transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-slate-200"></div>

            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.role}</p>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isProfileOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-border-light p-2 z-50"
                  >
                    <button 
                      onClick={() => {
                        navigate('/settings');
                        setIsProfileOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 mr-3" /> Profile Settings
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm font-medium text-danger rounded-xl hover:bg-danger/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet context={{ selectedClient, clients }} />
          </motion.div>
        </main>
      </div>

      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-[#111827] text-white z-50 p-8 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold">Social Orbit</h1>
              </div>

              <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-4 text-base font-medium rounded-2xl transition-all",
                        isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Icon className="w-6 h-6 mr-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-4 text-base font-medium text-slate-400 mt-auto"
              >
                <LogOut className="w-6 h-6 mr-4" />
                Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
