import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Eye,
  Heart,
  CheckSquare
} from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Dashboard() {
  const { selectedClient } = useOutletContext<{ selectedClient: any }>();
  const [stats, setStats] = useState({
    clients: 0,
    posts: 0,
    pending: 0,
    scheduled: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [taskStats, setTaskStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clients, posts] = await Promise.all([
          api.get('/clients'),
          api.get('/posts')
        ]);
        
        setStats({
          clients: clients.length,
          posts: posts.length,
          pending: posts.filter((p: any) => p.status === 'Pending Approval').length,
          scheduled: posts.filter((p: any) => p.status === 'Scheduled').length
        });
        setRecentPosts(posts.slice(0, 5));

        if (selectedClient) {
          const tasks = await api.get(`/tasks?client_id=${selectedClient.id}`);
          const distribution = [
            { name: 'Todo', value: tasks.filter((t: any) => t.status === 'Todo').length, color: '#94a3b8' },
            { name: 'In Progress', value: tasks.filter((t: any) => t.status === 'In Progress').length, color: '#f59e0b' },
            { name: 'Done', value: tasks.filter((t: any) => t.status === 'Done').length, color: '#10b981' },
          ].filter(item => item.value > 0);
          setTaskStats(distribution);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedClient]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const statCards = [
    { name: 'Active Clients', value: stats.clients, icon: Users, color: 'text-primary', bg: 'bg-primary/10', trend: '+12%' },
    { name: 'Total Posts', value: stats.posts, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+5%' },
    { name: 'Pending Approval', value: stats.pending, icon: Clock, color: 'text-warning', bg: 'bg-warning/10', trend: '-2%' },
    { name: 'Scheduled', value: stats.scheduled, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', trend: '+18%' },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Agency Overview</h1>
          <p className="text-slate-500 mt-2 text-lg">Welcome back! Here's a summary of your agency's performance.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Download Report</Button>
          <Link to="/calendar">
            <Button>Create New Post</Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover>
                <div className="flex items-center justify-between mb-6">
                  <div className={`${stat.bg} p-4 rounded-2xl`}>
                    <Icon className={`w-7 h-7 ${stat.color}`} />
                  </div>
                  <Badge variant={stat.trend.startsWith('+') ? 'success' : 'danger'}>
                    <TrendingUp className="w-3 h-3 mr-1" /> {stat.trend}
                  </Badge>
                </div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.name}</p>
                <p className="text-4xl font-black text-slate-900 mt-2">{stat.value}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Content</CardTitle>
              <Link to="/calendar">
                <Button variant="ghost" size="sm">
                  View Calendar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <div className="divide-y divide-slate-50 -mx-6">
              {recentPosts.length > 0 ? recentPosts.map((post: any) => (
                <div key={post.id} className="p-6 flex items-center hover:bg-slate-50 transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex-shrink-0 mr-5 flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-primary/20 transition-colors">
                    {post.media_url ? (
                      <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Calendar className="text-slate-400 w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{post.caption || 'No caption'}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{post.client_name} • {post.platform}</p>
                  </div>
                  <div className="ml-4">
                    <Badge variant={
                      post.status === 'Scheduled' ? 'success' :
                      post.status === 'Pending Approval' ? 'warning' :
                      'default'
                    }>
                      {post.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="text-slate-300 w-8 h-8" />
                  </div>
                  <p className="text-slate-500 font-medium">No content found. Start by creating a post!</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-primary text-white border-none shadow-2xl shadow-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">AI Content Assistant</h2>
              <p className="text-primary-100 mb-8 leading-relaxed">Generate high-converting captions and hashtags for your clients in seconds.</p>
              <Link to="/ai-tools">
                <Button variant="secondary" className="w-full py-4">
                  Try AI Tools <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Tasks Distribution</CardTitle>
              <Link to="/tasks">
                <Button variant="ghost" size="sm">
                  Manage <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <div className="h-[250px] w-full">
              {taskStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <CheckSquare className="w-12 h-12 text-slate-200 mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No tasks found for this client.</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Summary</CardTitle>
            </CardHeader>
            <div className="space-y-6">
              {[
                { label: 'Avg. Likes', value: '1,284', icon: Heart, color: 'text-pink-500' },
                { label: 'Avg. Comments', value: '452', icon: MessageSquare, color: 'text-blue-500' },
                { label: 'Avg. Reach', value: '12.5K', icon: Eye, color: 'text-emerald-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
