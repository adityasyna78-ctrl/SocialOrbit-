import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  List,
  MoreVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfToday, isWithinInterval, differenceInDays, startOfDay } from 'date-fns';

type TaskStatus = 'Todo' | 'In Progress' | 'Done';

interface Task {
  id: number;
  client_id: number;
  title: string;
  description: string;
  status: TaskStatus;
  start_date: string;
  end_date: string;
}

export default function Tasks() {
  const { selectedClient } = useOutletContext<{ selectedClient: any }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'gantt'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Todo' as TaskStatus,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd')
  });

  useEffect(() => {
    if (selectedClient) {
      fetchTasks();
    }
  }, [selectedClient]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/tasks?client_id=${selectedClient.id}`);
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { ...newTask, client_id: selectedClient.id });
      setIsModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        status: 'Todo',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd')
      });
      fetchTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: TaskStatus) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status:', err);
      fetchTasks(); // Rollback
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await api.delete(`/tasks/${taskId}`);
    } catch (err) {
      console.error('Failed to delete task:', err);
      fetchTasks();
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Gantt Chart Logic
  const timelineDays = 14;
  const startDate = startOfToday();
  const days = Array.from({ length: timelineDays }, (_, i) => addDays(startDate, i));

  const getTaskPosition = (task: Task) => {
    const taskStart = startOfDay(new Date(task.start_date));
    const taskEnd = startOfDay(new Date(task.end_date));
    
    const startOffset = differenceInDays(taskStart, startDate);
    const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
    
    return {
      left: `${(startOffset / timelineDays) * 100}%`,
      width: `${(duration / timelineDays) * 100}%`
    };
  };

  if (!selectedClient) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Filter className="text-slate-400 w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Select a client</h2>
        <p className="text-slate-500 mt-2">Please select a client from the top bar to manage their tasks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Task Manager</h1>
          <p className="text-slate-500 mt-2 text-lg">Track and manage project tasks for {selectedClient.name}.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView('gantt')}
              className={`p-2 rounded-lg transition-all ${view === 'gantt' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-12 px-6">
            <Plus className="w-5 h-5 mr-2" /> New Task
          </Button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
            <span>Todo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span>Done</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : view === 'list' ? (
        <div className="grid grid-cols-1 gap-4">
          {['Todo', 'In Progress', 'Done'].map((status) => (
            <div key={status} className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{status}</h3>
                <Badge variant="default" className="text-[10px]">{filteredTasks.filter(t => t.status === status).length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.filter(t => t.status === status).map((task) => (
                  <motion.div key={task.id} layoutId={`task-${task.id}`}>
                    <Card className="group hover:border-primary/30 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleUpdateStatus(task.id, task.status === 'Done' ? 'Todo' : 'Done')}
                            className={`p-1 rounded-lg transition-colors ${task.status === 'Done' ? 'text-success bg-success/10' : 'text-slate-300 hover:text-primary hover:bg-primary/5'}`}
                          >
                            {task.status === 'Done' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <h4 className={`font-bold text-slate-900 ${task.status === 'Done' ? 'line-through text-slate-400' : ''}`}>{task.title}</h4>
                        </div>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-300 hover:text-danger p-1 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-500 mb-6 line-clamp-2">{task.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(task.end_date), 'MMM d')}</span>
                        </div>
                        <select 
                          value={task.status}
                          onChange={(e) => handleUpdateStatus(task.id, e.target.value as TaskStatus)}
                          className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border-none rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary/20"
                        >
                          <option value="Todo">Todo</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                {filteredTasks.filter(t => t.status === status).length === 0 && (
                  <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                    <p className="text-slate-400 text-sm font-medium">No tasks in {status}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[1000px]">
              {/* Timeline Header */}
              <div className="grid grid-cols-[250px_1fr] border-b border-slate-100">
                <div className="p-4 bg-slate-50/50 border-r border-slate-100 font-bold text-slate-900 text-sm">Task Name</div>
                <div className="grid grid-cols-14 h-full">
                  {days.map((day, i) => (
                    <div key={i} className={`p-4 text-center border-r border-slate-100 last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(day, 'EEE')}</p>
                      <p className={`text-sm font-black mt-1 ${isSameDay(day, new Date()) ? 'text-primary' : 'text-slate-900'}`}>{format(day, 'd')}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Timeline Rows */}
              <div className="divide-y divide-slate-50">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="grid grid-cols-[250px_1fr] group hover:bg-slate-50/50 transition-colors">
                    <div className="p-4 border-r border-slate-100 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        task.status === 'Done' ? 'bg-success' : 
                        task.status === 'In Progress' ? 'bg-warning' : 'bg-slate-200'
                      }`}></div>
                      <span className={`text-sm font-bold text-slate-900 truncate ${task.status === 'Done' ? 'line-through text-slate-400' : ''}`}>{task.title}</span>
                    </div>
                    <div className="relative h-14">
                      {/* Grid lines */}
                      <div className="absolute inset-0 grid grid-cols-14 pointer-events-none">
                        {days.map((_, i) => (
                          <div key={i} className="border-r border-slate-100/50 last:border-r-0"></div>
                        ))}
                      </div>
                      
                      {/* Task Bar */}
                      {(() => {
                        const pos = getTaskPosition(task);
                        return (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-xl flex items-center px-3 shadow-sm border"
                            style={{ 
                              left: pos.left, 
                              width: pos.width,
                              backgroundColor: task.status === 'Done' ? '#ecfdf5' : task.status === 'In Progress' ? '#fffbeb' : '#f8fafc',
                              borderColor: task.status === 'Done' ? '#10b98120' : task.status === 'In Progress' ? '#f59e0b20' : '#e2e8f0',
                              color: task.status === 'Done' ? '#059669' : task.status === 'In Progress' ? '#d97706' : '#64748b'
                            }}
                          >
                            <span className="text-[10px] font-black uppercase tracking-wider truncate">{task.status}</span>
                          </motion.div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Create Task Modal */}
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
                <h2 className="text-2xl font-bold text-slate-900">Create New Task</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateTask} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Task Title</label>
                  <input 
                    type="text" 
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="What needs to be done?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                  <textarea 
                    rows={3}
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                    placeholder="Add more details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Start Date</label>
                    <input 
                      type="date" 
                      required
                      value={newTask.start_date}
                      onChange={(e) => setNewTask({...newTask, start_date: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">End Date</label>
                    <input 
                      type="date" 
                      required
                      value={newTask.end_date}
                      onChange={(e) => setNewTask({...newTask, end_date: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <Button type="button" variant="outline" className="flex-1 h-14" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-14">
                    Create Task
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

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
