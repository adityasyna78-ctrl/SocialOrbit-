import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye, 
  Filter, 
  Calendar as CalendarIcon,
  Smile,
  Meh,
  Frown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion } from 'motion/react';

export default function Analytics() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState<any>(null);

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
      fetchAnalytics();
    }
  }, [selectedClient, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics?client_id=${selectedClient.id}&start_date=${dateRange.start}&end_date=${dateRange.end}`);
      setData(res);
      
      setSentiment({
        positive: 65,
        neutral: 25,
        negative: 10,
        summary: "Overall sentiment is highly positive. Customers are particularly excited about the recent product launch and brand tone."
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const platformData = [
    { name: 'Instagram', value: 45 },
    { name: 'Facebook', value: 25 },
    { name: 'Twitter', value: 15 },
    { name: 'LinkedIn', value: 10 },
    { name: 'TikTok', value: 5 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Advanced Analytics</h1>
          <p className="text-slate-500 mt-2 text-lg">Real-time performance tracking and sentiment analysis.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-border-light shadow-sm">
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
          <div className="flex items-center px-4">
            <CalendarIcon className="w-5 h-5 text-slate-400 mr-3" />
            <input 
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="text-sm font-bold text-slate-700 outline-none bg-transparent py-2 cursor-pointer"
            />
            <span className="mx-3 text-slate-300 font-bold">→</span>
            <input 
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="text-sm font-bold text-slate-700 outline-none bg-transparent py-2 cursor-pointer"
            />
          </div>
          <Button onClick={fetchAnalytics} size="sm" className="h-10 w-10 p-0">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Reach', value: '1.2M', icon: Eye, color: 'text-primary', bg: 'bg-primary/10', trend: '+12%', positive: true },
          { label: 'Total Likes', value: '45.8K', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', trend: '+8%', positive: true },
          { label: 'Comments', value: '12.4K', icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+15%', positive: true },
          { label: 'Shares', value: '8.2K', icon: Share2, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '-2%', positive: false },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card hover>
              <div className="flex items-center justify-between mb-6">
                <div className={`${stat.bg} p-4 rounded-2xl`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <Badge variant={stat.positive ? 'success' : 'danger'} className="px-2 py-1">
                  {stat.positive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.trend}
                </Badge>
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{stat.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reach</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Likes</span>
                </div>
              </div>
            </CardHeader>
            <div className="h-[400px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                    dy={15} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                  />
                  <Area type="monotone" dataKey="reach" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorReach)" />
                  <Area type="monotone" dataKey="likes" stroke="#22C55E" strokeWidth={4} fillOpacity={1} fill="url(#colorLikes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Sentiment Analysis <Sparkles className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            
            <div className="flex-1 flex flex-col justify-center space-y-8">
              <div className="space-y-6">
                {[
                  { label: 'Positive', value: sentiment?.positive, icon: Smile, color: 'text-success', bg: 'bg-success' },
                  { label: 'Neutral', value: sentiment?.neutral, icon: Meh, color: 'text-warning', bg: 'bg-warning' },
                  { label: 'Negative', value: sentiment?.negative, icon: Frown, color: 'text-danger', bg: 'bg-danger' },
                ].map((item) => (
                  <div key={item.label} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.color.replace('text-', 'bg-')}/10`}>
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                      </div>
                      <span className="text-lg font-black text-slate-900">{item.value}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${item.bg} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                  AI Insights
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic pt-2">
                  "{sentiment?.summary}"
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <div className="h-[350px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 12, fontWeight: 700}} 
                  width={100} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#4F46E5" radius={[0, 12, 12, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Rate (%)</CardTitle>
          </CardHeader>
          <div className="h-[350px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#8b5cf6" 
                  strokeWidth={5} 
                  dot={{r: 8, fill: '#8b5cf6', strokeWidth: 4, stroke: '#fff'}} 
                  activeDot={{r: 10, shadow: '0 0 20px rgba(139, 92, 246, 0.4)'}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
