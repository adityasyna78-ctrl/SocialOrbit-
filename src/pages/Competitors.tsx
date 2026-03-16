import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BarChart3, 
  Search, 
  Plus, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter,
  ExternalLink,
  MoreVertical,
  ArrowUpRight,
  Eye,
  MessageSquare,
  Heart
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion } from 'motion/react';
import { format } from 'date-fns';

const PLATFORM_ICONS: Record<string, any> = {
  Instagram: Instagram,
  Facebook: Facebook,
  Twitter: Twitter,
  LinkedIn: Linkedin,
};

export default function Competitors() {
  const { selectedClient } = useOutletContext<{ selectedClient: any }>();
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedClient) {
      fetchCompetitors();
    }
  }, [selectedClient]);

  const fetchCompetitors = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/competitors?client_id=${selectedClient.id}`);
      setCompetitors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Competitor Tracking</h1>
          <p className="text-slate-500 mt-2 text-lg">Monitor competitor performance and social listening for {selectedClient?.name}.</p>
        </div>
        <Button className="h-12 px-6 rounded-2xl shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 mr-2" /> Add Competitor
        </Button>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Activity className="w-6 h-6" />
            </div>
            <Badge variant="default" className="bg-emerald-50 text-emerald-600 border-emerald-100">
              +12.5% vs last month
            </Badge>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Avg. Engagement Rate</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">4.8%</h3>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <Badge variant="default" className="bg-blue-50 text-blue-600 border-blue-100">
              Top Performer
            </Badge>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Competitor Reach</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">5.2M</h3>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <Badge variant="default" className="bg-amber-50 text-amber-600 border-amber-100">
              Increasing
            </Badge>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Market Share (SOV)</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">24.2%</h3>
        </Card>
      </div>

      {/* Competitor List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Tracked Competitors</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-slate-500">
              <Search className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse"></div>
            ))}
          </div>
        ) : competitors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitors.map((comp) => {
              const Icon = PLATFORM_ICONS[comp.platform] || Activity;
              return (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="p-6 hover:shadow-md transition-all border-none shadow-sm bg-white group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center relative">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${comp.name}&background=random`} 
                            className="w-full h-full rounded-2xl object-cover"
                            alt={comp.name}
                          />
                          <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                            <Icon className="w-3 h-3 text-slate-600" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{comp.name}</h4>
                          <p className="text-sm text-slate-400 font-medium">{comp.handle}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Followers</p>
                        <p className="text-lg font-bold text-slate-900">{(comp.followers / 1000).toFixed(1)}k</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Engagement</p>
                        <p className="text-lg font-bold text-slate-900">{comp.engagement_rate}%</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Last Post</span>
                        <span className="text-slate-900 font-bold">
                          {comp.last_post_date ? format(new Date(comp.last_post_date), 'MMM d, yyyy') : 'N/A'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-3/4 rounded-full"></div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 font-bold">
                        <Eye className="w-4 h-4 mr-2" /> View Profile
                      </Button>
                      <ArrowUpRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center bg-white border-dashed border-2 border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No competitors tracked</h3>
            <p className="text-slate-500 mb-6">Start monitoring your competitors to gain market insights.</p>
            <Button>Add Your First Competitor</Button>
          </Card>
        )}
      </div>

      {/* Social Listening Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Social Listening</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-8 border-none shadow-sm bg-white space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Brand Mentions</h3>
              <Badge variant="default" className="bg-primary/10 text-primary border-none">Live Feed</Badge>
            </div>
            
            <div className="space-y-6">
              {[
                { user: 'FitnessJunkie', text: 'Just tried the new workout plan from FitPro Elite, honestly {client} has better results.', time: '2h ago', sentiment: 'Positive' },
                { user: 'GymRat99', text: 'Comparing {client} vs GymShark for my next supplement order. Any thoughts?', time: '5h ago', sentiment: 'Neutral' },
                { user: 'CoachSarah', text: 'The community at {client} is unmatched. Competitors should take notes.', time: '1d ago', sentiment: 'Positive' },
              ].map((mention, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">@{mention.user}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{mention.time}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {mention.text.replace('{client}', selectedClient?.name || 'Client')}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center text-[10px] font-bold text-emerald-500 uppercase">
                        <TrendingUp className="w-3 h-3 mr-1" /> {mention.sentiment}
                      </span>
                      <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase">
                        <Heart className="w-3 h-3 mr-1" /> 12
                      </span>
                      <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase">
                        <MessageSquare className="w-3 h-3 mr-1" /> 4
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white">
            <h3 className="font-bold text-slate-900 mb-6">Sentiment Analysis</h3>
            <div className="space-y-8">
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-slate-100" strokeDasharray="100, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-primary" strokeDasharray="75, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900">75%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Positive</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Positive</span>
                  <span className="text-sm font-bold text-emerald-500">75%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[75%] rounded-full"></div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-slate-600">Neutral</span>
                  <span className="text-sm font-bold text-slate-400">20%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 w-[20%] rounded-full"></div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-slate-600">Negative</span>
                  <span className="text-sm font-bold text-rose-500">5%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-[5%] rounded-full"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
