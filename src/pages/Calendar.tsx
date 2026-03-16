import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Video,
  Youtube,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Calendar as CalendarIcon,
  MoreVertical,
  Send,
  Eye
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'motion/react';

const PLATFORMS = [
  { name: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
  { name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Twitter', icon: Twitter, color: 'text-sky-500', bg: 'bg-sky-50' },
  { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
  { name: 'TikTok', icon: Video, color: 'text-black', bg: 'bg-slate-100' },
  { name: 'YouTube', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' },
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [customizeByPlatform, setCustomizeByPlatform] = useState(false);
  const [modalTab, setModalTab] = useState<'Social' | 'YouTube'>('Social');

  const [newPost, setNewPost] = useState<any>({
    client_id: '',
    title: '',
    caption: '',
    platformCaptions: {},
    hashtags: '',
    platforms: ['Instagram'],
    media_url: '',
    scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    status: 'Draft',
    metadata: {
      visibility: 'public',
      category: 'Entertainment',
      madeForKids: false,
      tags: ''
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPost({ ...newPost, media_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePlatform = (platformName: string) => {
    setNewPost((prev: any) => {
      const platforms = prev.platforms.includes(platformName)
        ? prev.platforms.filter((p: string) => p !== platformName)
        : [...prev.platforms, platformName];
      return { ...prev, platforms: platforms.length > 0 ? platforms : prev.platforms };
    });
  };

  const fetchData = async () => {
    try {
      const [postsData, clientsData] = await Promise.all([
        api.get('/posts'),
        api.get('/clients')
      ]);
      setPosts(postsData);
      setClients(clientsData);
      if (clientsData.length > 0 && !newPost.client_id) {
        setNewPost(prev => ({ ...prev, client_id: clientsData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const postData = { ...newPost };
      if (modalTab === 'YouTube') {
        postData.platforms = ['YouTube'];
      }
      await api.post('/posts', postData);
      setIsModalOpen(false);
      setNewPost({
        client_id: clients[0]?.id || '',
        title: '',
        caption: '',
        platformCaptions: {},
        hashtags: '',
        platforms: ['Instagram'],
        media_url: '',
        scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        status: 'Draft',
        metadata: {
          visibility: 'public',
          category: 'Entertainment',
          madeForKids: false,
          tags: ''
        }
      });
      setCustomizeByPlatform(false);
      setModalTab('Social');
      fetchData();
    } catch (err) {
      alert('Failed to create post');
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getPostsForDay = (day: Date) => {
    return posts.filter(post => isSameDay(new Date(post.scheduled_at), day));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Content Planner</h1>
          <p className="text-slate-500 mt-2 text-lg">Schedule and manage your social media content across all platforms.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white border border-border-light rounded-2xl overflow-hidden shadow-sm">
            <button 
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-4 hover:bg-slate-50 transition-colors border-r border-border-light"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="px-8 py-4 font-bold text-slate-900 min-w-[200px] text-center text-lg">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <button 
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-4 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-14 px-8">
            <Plus className="w-5 h-5 mr-2" /> Create Post
          </Button>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-border-light shadow-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-border-light">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayPosts = getPostsForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={day.toString()} 
                className={`min-h-[160px] p-3 border-r border-b border-slate-50 last:border-r-0 transition-all ${
                  !isCurrentMonth ? 'bg-slate-50/30' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${
                    isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 
                    isCurrentMonth ? 'text-slate-900' : 'text-slate-300'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayPosts.length > 0 && (
                    <Badge variant="info" className="px-1.5 py-0.5 text-[10px]">
                      {dayPosts.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {dayPosts.map((post: any) => {
                    const PlatformIcon = PLATFORMS.find(p => p.name === post.platform)?.icon || Instagram;
                    return (
                      <motion.div 
                        key={post.id} 
                        layoutId={`post-${post.id}`}
                        onClick={() => setSelectedPost(post)}
                        className={`p-2 rounded-xl text-[10px] font-bold border cursor-pointer hover:shadow-md transition-all group relative ${
                          post.status === 'Approved' ? 'bg-success/5 border-success/20 text-success' :
                          post.status === 'Pending Approval' ? 'bg-warning/5 border-warning/20 text-warning' :
                          'bg-primary/5 border-primary/20 text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-white/50">
                            <PlatformIcon className="w-3 h-3 flex-shrink-0" />
                          </div>
                          <span className="truncate flex-1">{post.caption || 'No caption'}</span>
                        </div>
                        
                        {post.status === 'Approved' && (
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Publish this post to social media now?')) {
                                  api.post(`/posts/${post.id}/publish`, {}).then(() => {
                                    alert('Published successfully!');
                                    fetchData();
                                  }).catch(err => alert('Publishing failed: ' + err.message));
                                }
                              }}
                              className="w-full py-1.5 bg-success text-white rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 shadow-sm"
                            >
                              <Send className="w-2.5 h-2.5" /> Publish Now
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Post Modal */}
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
              className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <h2 className="text-2xl font-bold text-slate-900">Create New Post</h2>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setModalTab('Social')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        modalTab === 'Social' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Social Media
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab('YouTube')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        modalTab === 'YouTube' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      YouTube Studio
                    </button>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreatePost} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Select Client</label>
                    <select 
                      required
                      value={newPost.client_id}
                      onChange={(e) => setNewPost({...newPost, client_id: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    >
                      <option value="">Select a client...</option>
                      {clients.map((client: any) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>

                  {modalTab === 'Social' ? (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Target Platforms</label>
                      <div className="grid grid-cols-5 gap-3">
                        {PLATFORMS.filter(p => p.name !== 'YouTube').map(p => {
                          const Icon = p.icon;
                          const isSelected = newPost.platforms.includes(p.name);
                          return (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => togglePlatform(p.name)}
                              className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                                isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                              }`}
                            >
                              <Icon className="w-6 h-6" />
                              <span className="text-[10px] font-bold">{p.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Video Title</label>
                        <input 
                          type="text" 
                          required
                          value={newPost.title}
                          onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          placeholder="Enter catchy video title..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">Visibility</label>
                          <select 
                            value={newPost.metadata.visibility}
                            onChange={(e) => setNewPost({...newPost, metadata: { ...newPost.metadata, visibility: e.target.value }})}
                            className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="unlisted">Unlisted</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">Category</label>
                          <select 
                            value={newPost.metadata.category}
                            onChange={(e) => setNewPost({...newPost, metadata: { ...newPost.metadata, category: e.target.value }})}
                            className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          >
                            <option value="Entertainment">Entertainment</option>
                            <option value="Education">Education</option>
                            <option value="Gaming">Gaming</option>
                            <option value="Music">Music</option>
                            <option value="Tech">Tech</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-1">
                        <input 
                          type="checkbox" 
                          id="madeForKids"
                          checked={newPost.metadata.madeForKids}
                          onChange={(e) => setNewPost({...newPost, metadata: { ...newPost.metadata, madeForKids: e.target.checked }})}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="madeForKids" className="text-sm font-medium text-slate-700">Made for kids?</label>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Schedule Date & Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="datetime-local" 
                        required
                        value={newPost.scheduled_at}
                        onChange={(e) => setNewPost({...newPost, scheduled_at: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-bold text-slate-700">{modalTab === 'YouTube' ? 'Video Description' : 'Caption'}</label>
                    {modalTab === 'Social' && (
                      <button 
                        type="button"
                        onClick={() => setCustomizeByPlatform(!customizeByPlatform)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-all ${
                          customizeByPlatform ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {customizeByPlatform ? 'Customizing by Platform' : 'Customize by Platform'}
                      </button>
                    )}
                  </div>

                  {modalTab === 'Social' ? (
                    !customizeByPlatform ? (
                      <textarea 
                        rows={5}
                        required
                        value={newPost.caption}
                        onChange={(e) => setNewPost({...newPost, caption: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                        placeholder="Write your engaging caption here..."
                      />
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {newPost.platforms.map((platform: string) => {
                          const platformInfo = PLATFORMS.find(p => p.name === platform);
                          const Icon = platformInfo?.icon || Instagram;
                          return (
                            <div key={platform} className="space-y-2">
                              <div className="flex items-center gap-2 ml-1">
                                <Icon className={`w-3 h-3 ${platformInfo?.color}`} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{platform} Caption</span>
                              </div>
                              <textarea 
                                rows={3}
                                required
                                value={newPost.platformCaptions[platform] || newPost.caption}
                                onChange={(e) => setNewPost({
                                  ...newPost, 
                                  platformCaptions: {
                                    ...newPost.platformCaptions,
                                    [platform]: e.target.value
                                  }
                                })}
                                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                placeholder={`Write caption for ${platform}...`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    <textarea 
                      rows={5}
                      required
                      value={newPost.caption}
                      onChange={(e) => setNewPost({...newPost, caption: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                      placeholder="Write your video description here..."
                    />
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">{modalTab === 'YouTube' ? 'Video File' : 'Media Assets'}</label>
                    {newPost.media_url ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-100 aspect-video bg-slate-50 group">
                        {newPost.media_url.startsWith('data:video') ? (
                          <video src={newPost.media_url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={newPost.media_url} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <button 
                          type="button"
                          onClick={() => setNewPost({...newPost, media_url: ''})}
                          className="absolute top-3 right-3 p-2 bg-white/90 rounded-xl text-slate-600 hover:text-danger shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all hover:border-primary/30">
                        <div className="flex flex-col items-center justify-center p-6">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                            <Upload className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm text-slate-900 font-bold">Upload {modalTab === 'YouTube' ? 'Video' : 'Media'}</p>
                          <p className="text-xs text-slate-500 mt-1">{modalTab === 'YouTube' ? 'MP4, MOV up to 500MB' : 'Images or Videos up to 50MB'}</p>
                        </div>
                        <input type="file" className="hidden" accept={modalTab === 'YouTube' ? 'video/*' : 'image/*,video/*'} onChange={handleFileChange} />
                      </label>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">{modalTab === 'YouTube' ? 'Video Tags' : 'Hashtags'}</label>
                    <input 
                      type="text" 
                      value={modalTab === 'YouTube' ? newPost.metadata.tags : newPost.hashtags}
                      onChange={(e) => {
                        if (modalTab === 'YouTube') {
                          setNewPost({...newPost, metadata: { ...newPost.metadata, tags: e.target.value }});
                        } else {
                          setNewPost({...newPost, hashtags: e.target.value});
                        }
                      }}
                      className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      placeholder={modalTab === 'YouTube' ? "tag1, tag2, tag3" : "#socialmedia #agency #marketing"}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex gap-4 pt-6 border-t border-slate-100">
                  <Button type="button" variant="outline" className="flex-1 h-14" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-14 bg-slate-900 hover:bg-slate-800">
                    {modalTab === 'YouTube' ? 'Upload to YouTube' : 'Schedule Content'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Badge variant={
                    selectedPost.status === 'Approved' ? 'success' :
                    selectedPost.status === 'Pending Approval' ? 'warning' :
                    'default'
                  }>
                    {selectedPost.status}
                  </Badge>
                  <span className="text-slate-400">•</span>
                  <span className="text-sm font-bold text-slate-500">
                    Scheduled for {format(new Date(selectedPost.scheduled_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                <button onClick={() => setSelectedPost(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {selectedPost.media_url && (
                    <div className="rounded-2xl overflow-hidden border border-slate-100 aspect-square bg-slate-50">
                      {selectedPost.media_url.includes('video') ? (
                        <video src={selectedPost.media_url} className="w-full h-full object-cover" controls />
                      ) : (
                        <img src={selectedPost.media_url} alt="Post" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  {selectedPost.platform === 'YouTube' && selectedPost.title && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Video Title</p>
                      <p className="text-slate-900 text-xl font-bold leading-tight">{selectedPost.title}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{selectedPost.platform === 'YouTube' ? 'Description' : 'Caption'}</p>
                    <p className="text-slate-900 text-lg leading-relaxed">{selectedPost.caption}</p>
                  </div>
                  {selectedPost.platform === 'YouTube' ? (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedPost.metadata && (
                        <>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Visibility</p>
                            <Badge variant="info" className="capitalize">
                              {JSON.parse(selectedPost.metadata).visibility}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Category</p>
                            <p className="text-sm font-medium text-slate-700">{JSON.parse(selectedPost.metadata).category}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Hashtags</p>
                      <p className="text-primary font-medium">{selectedPost.hashtags}</p>
                    </div>
                  )}
                  {selectedPost.platform === 'YouTube' && selectedPost.metadata && JSON.parse(selectedPost.metadata).tags && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(selectedPost.metadata).tags.split(',').map((tag: string) => (
                          <div key={tag}>
                            <Badge variant="default" className="text-[10px]">
                              {tag.trim()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-4 flex gap-3">
                    {selectedPost.status !== 'Approved' && (
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          api.patch(`/posts/${selectedPost.id}`, { status: 'Approved' }).then(() => {
                            fetchData();
                            setSelectedPost(null);
                          });
                        }}
                      >
                        Approve Post
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1">Edit Post</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
