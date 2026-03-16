import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { 
  FileText, 
  Download, 
  Plus, 
  Calendar as CalendarIcon, 
  Users, 
  BarChart3, 
  Sparkles,
  Check,
  X,
  FileDown,
  ChevronRight,
  Layout,
  Settings
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'motion/react';

export default function Reports() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [reports, setReports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState({
    name: '',
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    includeAnalytics: true,
    includeTopPosts: true,
    includeAIInsights: true,
  });

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
      fetchReports();
    }
  }, [selectedClient]);

  const fetchReports = async () => {
    const data = await api.get(`/reports?client_id=${selectedClient.id}`);
    setReports(data);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await api.post('/reports', {
        client_id: selectedClient.id,
        name: config.name || `Report - ${format(new Date(), 'MMM yyyy')}`,
        config: config
      });

      if (reportRef.current) {
        const canvas = await html2canvas(reportRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${selectedClient.name}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      }

      setIsModalOpen(false);
      fetchReports();
    } catch (err) {
      console.error(err);
      alert('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Performance Reports</h1>
          <p className="text-slate-500 mt-2 text-lg">Generate professional, branded performance reports for your clients.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="h-14 px-8">
          <Plus className="w-5 h-5 mr-2" /> New Report
        </Button>
      </header>

      <Card className="p-6 max-w-md">
        <label className="text-sm font-bold text-slate-700 ml-1 mb-2 block">Select Client</label>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
          <select 
            value={selectedClient?.id || ''}
            onChange={(e) => setSelectedClient(clients.find((c: any) => c.id == e.target.value))}
            className="flex-1 bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
          >
            {clients.map((client: any) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reports.map((report: any, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover className="group">
              <div className="flex items-center justify-between mb-8">
                <div className="bg-primary/10 p-4 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <FileText className="w-8 h-8" />
                </div>
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                  <Download className="w-5 h-5" />
                </Button>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{report.name}</h3>
              <p className="text-slate-500 text-sm mb-6 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Generated on {format(new Date(report.created_at), 'MMM d, yyyy')}
              </p>
              <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                <Badge variant="success">Completed</Badge>
                <Button variant="ghost" size="sm" className="text-primary font-bold">
                  View Details <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
        {reports.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileDown className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No reports yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Start by generating your first performance report for this client.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="mt-8">
              <Plus className="w-4 h-4 mr-2" /> Create First Report
            </Button>
          </div>
        )}
      </div>

      {/* New Report Modal */}
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
              className="relative bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Configure Report</h2>
                    <p className="text-slate-500 text-sm">Customize your performance report layout and data.</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-5 space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Report Name</label>
                      <input 
                        type="text" 
                        value={config.name}
                        onChange={(e) => setConfig({...config, name: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        placeholder="e.g. Monthly Performance - Feb 2024"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Start Date</label>
                        <input 
                          type="date" 
                          value={config.startDate}
                          onChange={(e) => setConfig({...config, startDate: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">End Date</label>
                        <input 
                          type="date" 
                          value={config.endDate}
                          onChange={(e) => setConfig({...config, endDate: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Include Sections</h4>
                      {[
                        { key: 'includeAnalytics', label: 'Performance Analytics', icon: BarChart3, desc: 'Charts and key metrics' },
                        { key: 'includeTopPosts', label: 'Top Performing Posts', icon: Layout, desc: 'Best content of the period' },
                        { key: 'includeAIInsights', label: 'AI-Generated Insights', icon: Sparkles, desc: 'Smart recommendations' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center p-5 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all group">
                          <div className="bg-primary/5 p-3 rounded-xl mr-5 group-hover:bg-primary/10 transition-colors">
                            <item.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-900">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={(config as any)[item.key]}
                              onChange={(e) => setConfig({...config, [item.key]: e.target.checked})}
                              className="w-6 h-6 rounded-lg border-slate-300 text-primary focus:ring-primary/20 transition-all"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Report Preview */}
                <div className="lg:col-span-7 bg-slate-100 rounded-3xl p-10 border border-slate-200 overflow-hidden flex flex-col items-center">
                  <div className="flex items-center justify-between w-full mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Preview</h4>
                    <Badge variant="default">A4 Format</Badge>
                  </div>
                  
                  <div ref={reportRef} className="bg-white shadow-2xl w-full max-w-[500px] aspect-[1/1.414] p-12 flex flex-col origin-top transform scale-90 md:scale-100">
                    {/* Report Header */}
                    <div className="flex justify-between items-start mb-16">
                      <div>
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white mb-3">
                          <BarChart3 className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Social Orbit</h1>
                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">Performance Report</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900">{selectedClient?.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">{config.startDate} — {config.endDate}</p>
                      </div>
                    </div>

                    {/* Report Content Mock */}
                    <div className="space-y-10 flex-1">
                      {config.includeAnalytics && (
                        <div>
                          <h5 className="text-[10px] font-black text-slate-900 mb-6 border-b-2 border-slate-100 pb-3 uppercase tracking-widest">Analytics Overview</h5>
                          <div className="grid grid-cols-3 gap-6">
                            {[
                              { label: 'Reach', value: '45.2K', trend: '+12%' },
                              { label: 'Likes', value: '2.8K', trend: '+8%' },
                              { label: 'Engagement', value: '4.2%', trend: '+15%' },
                            ].map(stat => (
                              <div key={stat.label} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-lg font-black text-slate-900">{stat.value}</p>
                                <p className="text-[8px] font-bold text-success mt-1">{stat.trend}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {config.includeAIInsights && (
                        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 relative">
                          <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-white text-[8px] font-black rounded-full uppercase tracking-widest">
                            AI Insights
                          </div>
                          <p className="text-[10px] text-slate-700 leading-relaxed italic pt-2">
                            "Engagement peaked on Wednesdays between 6-8 PM. Recommend increasing video content by 20% to capitalize on current trends in the {selectedClient?.niche} niche."
                          </p>
                        </div>
                      )}

                      {config.includeTopPosts && (
                        <div>
                          <h5 className="text-[10px] font-black text-slate-900 mb-6 border-b-2 border-slate-100 pb-3 uppercase tracking-widest">Top Performing Content</h5>
                          <div className="space-y-4">
                            {[1, 2].map(i => (
                              <div key={i} className="flex items-center gap-4 p-3 border border-slate-50 rounded-2xl">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex-shrink-0"></div>
                                <div className="flex-1">
                                  <div className="h-2.5 w-32 bg-slate-100 rounded-full mb-2"></div>
                                  <div className="h-2 w-20 bg-slate-50 rounded-full"></div>
                                </div>
                                <div className="text-[10px] font-black text-primary">98% SCORE</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Report Footer */}
                    <div className="mt-auto pt-10 border-t border-slate-100 flex justify-between items-center">
                      <p className="text-[9px] text-slate-400 font-bold">Generated by Social Orbit Agency Tool</p>
                      <p className="text-[9px] text-slate-400 font-bold tracking-widest">PAGE 01</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
                <Button 
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-14"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="flex-1 h-14"
                >
                  {isGenerating ? (
                    <><span className="animate-spin mr-2">◌</span> Generating PDF...</>
                  ) : (
                    <><Download className="w-5 h-5 mr-2" /> Generate & Download PDF</>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
