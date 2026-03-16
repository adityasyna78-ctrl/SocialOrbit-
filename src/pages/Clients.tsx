import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Briefcase,
  Target,
  MessageSquare,
  X,
  Filter
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'motion/react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newClient, setNewClient] = useState({
    name: '',
    niche: '',
    tone: '',
    target_audience: ''
  });

  const fetchClients = async () => {
    try {
      const data = await api.get('/clients');
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', newClient);
      setIsModalOpen(false);
      setNewClient({ name: '', niche: '', tone: '', target_audience: '' });
      fetchClients();
    } catch (err) {
      alert('Failed to create client');
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (confirm('Are you sure you want to delete this client? All associated posts will be removed.')) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients();
      } catch (err) {
        alert('Failed to delete client');
      }
    }
  };

  const filteredClients = clients.filter((client: any) => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.niche.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Client Management</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your brand portfolio and content strategies.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="h-14 px-8">
          <Plus className="w-5 h-5 mr-2" /> Add New Client
        </Button>
      </header>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or niche..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <Button variant="outline" className="h-12">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>
      </Card>

      <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-border-light">
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Niche</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Brand Tone</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Target Audience</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? filteredClients.map((client: any, index) => (
                <motion.tr 
                  key={client.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {client.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="info">{client.niche || 'General'}</Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center text-slate-600 text-sm">
                      <MessageSquare className="w-4 h-4 mr-2 text-slate-400" />
                      {client.tone || 'Not set'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center text-slate-600 text-sm">
                      <Target className="w-4 h-4 mr-2 text-slate-400" />
                      {client.target_audience || 'Not set'}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 w-9 p-0 text-danger hover:bg-danger/10 hover:text-danger"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="text-slate-300 w-8 h-8" />
                      </div>
                      <h3 className="text-slate-900 font-bold mb-1">No clients found</h3>
                      <p className="text-slate-500 text-sm">Try adjusting your search or add a new client to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Add New Client</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateClient} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Client Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Nike"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Niche</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Fitness"
                      value={newClient.niche}
                      onChange={(e) => setNewClient({...newClient, niche: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Brand Tone</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Energetic"
                      value={newClient.tone}
                      onChange={(e) => setNewClient({...newClient, tone: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Target Audience</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="e.g. Young adults interested in sports..."
                    value={newClient.target_audience}
                    onChange={(e) => setNewClient({...newClient, target_audience: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" className="flex-1 h-14" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-14">
                    Create Client
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
