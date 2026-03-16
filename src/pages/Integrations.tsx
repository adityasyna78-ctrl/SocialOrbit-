import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Video,
  CheckCircle2,
  Plus,
  Trash2,
  AlertCircle,
  Users,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion } from 'motion/react';

const PLATFORMS = [
  { name: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
  { name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Twitter', icon: Twitter, color: 'text-sky-500', bg: 'bg-sky-50' },
  { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
  { name: 'TikTok', icon: Video, color: 'text-black', bg: 'bg-slate-100' },
  { name: 'YouTube', icon: Video, color: 'text-red-600', bg: 'bg-red-50' },
];

export default function Integrations() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      const data = await api.get('/clients');
      setClients(data);
      if (data.length > 0) setSelectedClient(data[0]);
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchIntegrations();
    }
  }, [selectedClient]);

  const fetchIntegrations = async () => {
    try {
      const data = await api.get(`/integrations/${selectedClient.id}`);
      setIntegrations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      const { url } = await api.get(`/auth/url/${platform}?client_id=${selectedClient.id}`);
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      
      if (!authWindow) {
        alert('Please allow popups to connect your account.');
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.platform === platform) {
          fetchIntegrations();
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (err: any) {
      alert(err.message || 'Failed to start OAuth flow');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Platform Integrations</h1>
          <p className="text-slate-500 mt-2 text-lg">Connect your clients' social media accounts for direct publishing and real-time analytics.</p>
        </div>
        
        <div className="bg-white p-3 rounded-2xl border border-border-light shadow-sm flex items-center gap-4">
          <div className="flex items-center px-4 border-r border-border-light">
            <Users className="w-5 h-5 text-slate-400 mr-3" />
            <select 
              value={selectedClient?.id || ''}
              onChange={(e) => setSelectedClient(clients.find((c: any) => c.id == e.target.value))}
              className="text-sm font-bold text-slate-700 outline-none bg-transparent py-2 cursor-pointer"
            >
              {clients.map((client: any) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <Badge variant="info" className="mr-2">
            {integrations.length} Connected
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {PLATFORMS.map((platform, index) => {
          const Icon = platform.icon;
          const integration = integrations.find(i => i.platform === platform.name);
          const isConnected = !!integration;

          return (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className={`${platform.bg} p-5 rounded-2xl shadow-sm`}>
                      <Icon className={`w-10 h-10 ${platform.color}`} />
                    </div>
                    {isConnected ? (
                      <Badge variant="success" className="px-3 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="default" className="px-3 py-1">Disconnected</Badge>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{platform.name}</h3>
                  <p className="text-slate-500 leading-relaxed mb-8">
                    {isConnected 
                      ? `Successfully connected as ${integration.platform_user_name || 'Authorized User'}. Direct publishing is enabled.`
                      : `Connect your ${platform.name} account to enable direct publishing and real-time analytics for this client.`}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  {isConnected ? (
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full h-12">
                        <ExternalLink className="w-4 h-4 mr-2" /> View Account
                      </Button>
                      <Button variant="ghost" className="w-full h-12 text-danger hover:bg-danger/5">
                        <Trash2 className="w-4 h-4 mr-2" /> Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleConnect(platform.name)}
                      className="w-full h-14"
                    >
                      <Plus className="w-5 h-5 mr-2" /> Connect Account
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="bg-slate-900 text-white border-none p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">Secure OAuth Authentication</h3>
            <p className="text-slate-400 max-w-2xl">
              Social Orbit uses official OAuth 2.0 protocols to securely connect to social platforms. 
              We never store your passwords, only encrypted access tokens.
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4 max-w-xs">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <p className="text-amber-200 text-xs leading-relaxed">
                <strong>Note:</strong> LinkedIn and Facebook are supported in this demo. Ensure environment variables are set.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
