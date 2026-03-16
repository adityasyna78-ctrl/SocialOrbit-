import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  User, 
  Lock, 
  Bell, 
  Users, 
  CreditCard, 
  Shield, 
  Mail, 
  Camera,
  Check,
  AlertCircle,
  ChevronRight,
  LogOut,
  Globe,
  Smartphone
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'motion/react';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'team' | 'billing';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    role: ''
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setProfileForm({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        role: parsedUser.role || ''
      });
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await api.patch('/users/profile', {
        name: profileForm.name,
        email: profileForm.email
      });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.patch('/users/profile', {
        name: profileForm.name,
        email: profileForm.email,
        password: passwordForm.newPassword
      });
      setSuccess('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-2 text-lg">Manage your account settings and preferences.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card className="p-8 border-none shadow-sm bg-white">
                  <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-50">
                    <div className="relative group">
                      <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${profileForm.name}&background=random&size=128`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-md border border-slate-100 text-slate-600 hover:text-primary transition-colors">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{profileForm.name}</h3>
                      <p className="text-slate-500">{profileForm.role}</p>
                      <Badge variant="default" className="mt-2 bg-primary/10 text-primary border-none">
                        Active Account
                      </Badge>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Full Name</label>
                        <input 
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Email Address</label>
                        <input 
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Bio</label>
                      <textarea 
                        rows={4}
                        placeholder="Tell us about yourself..."
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      {success && (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                          <Check className="w-4 h-4" /> {success}
                        </div>
                      )}
                      {error && (
                        <div className="flex items-center gap-2 text-rose-600 text-sm font-bold">
                          <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                      )}
                      <div className="flex-1" />
                      <Button type="submit" disabled={loading} className="px-8">
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Card>

                <Card className="p-8 border-none shadow-sm bg-white">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Connected Accounts</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Google', icon: Globe, connected: true },
                      { name: 'GitHub', icon: Globe, connected: false },
                    ].map((account) => (
                      <div key={account.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <account.icon className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{account.name}</p>
                            <p className="text-xs text-slate-500">{account.connected ? 'Connected' : 'Not connected'}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className={account.connected ? 'text-rose-600' : 'text-primary'}>
                          {account.connected ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card className="p-8 border-none shadow-sm bg-white">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Change Password</h3>
                  <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Current Password</label>
                      <input 
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">New Password</label>
                      <input 
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                      <input 
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </Card>

                <Card className="p-8 border-none shadow-sm bg-white">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                    </div>
                    <Badge variant="default" className="bg-slate-100 text-slate-600 border-none">
                      Disabled
                    </Badge>
                  </div>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                    Enable 2FA
                  </Button>
                </Card>

                <Card className="p-8 border-none shadow-sm bg-white">
                  <h3 className="text-lg font-bold text-rose-600 mb-4">Danger Zone</h3>
                  <p className="text-sm text-slate-500 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                  <Button variant="ghost" className="text-rose-600 hover:bg-rose-50">
                    Delete Account
                  </Button>
                </Card>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card className="p-8 border-none shadow-sm bg-white">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Email Notifications</h3>
                  <div className="space-y-6">
                    {[
                      { title: 'Weekly Reports', desc: 'Receive a summary of your social media performance every Monday.' },
                      { title: 'New Mentions', desc: 'Get notified when your brand is mentioned on social media.' },
                      { title: 'Post Alerts', desc: 'Alerts for scheduled posts that failed to publish.' },
                      { title: 'Team Activity', desc: 'Notifications when team members add or edit content.' },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                        <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'team' && (
              <motion.div
                key="team"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card className="p-8 border-none shadow-sm bg-white">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Team Members</h3>
                      <p className="text-sm text-slate-500">Manage your agency team and their permissions.</p>
                    </div>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" /> Invite Member
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: 'Aditya S.', email: 'aditya@example.com', role: 'Admin', avatar: 'AS' },
                      { name: 'Sarah J.', email: 'sarah@example.com', role: 'Editor', avatar: 'SJ' },
                      { name: 'Mike R.', email: 'mike@example.com', role: 'Viewer', avatar: 'MR' },
                    ].map((member) => (
                      <div key={member.email} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                            {member.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="default" className="bg-slate-100 text-slate-600 border-none">
                            {member.role}
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'billing' && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card className="p-8 border-none shadow-sm bg-white">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Current Plan</h3>
                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                    <div>
                      <Badge variant="default" className="bg-primary text-white border-none mb-2">
                        Agency Pro
                      </Badge>
                      <h4 className="text-2xl font-bold text-slate-900">$199/month</h4>
                      <p className="text-sm text-slate-500">Next billing date: April 1, 2026</p>
                    </div>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                      Upgrade Plan
                    </Button>
                  </div>
                </Card>

                <Card className="p-8 border-none shadow-sm bg-white">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Payment Methods</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Visa ending in 4242</p>
                          <p className="text-xs text-slate-500">Expires 12/28</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-emerald-50 text-emerald-600 border-none">
                        Primary
                      </Badge>
                    </div>
                    <Button variant="ghost" className="text-primary font-bold">
                      <Plus className="w-4 h-4 mr-2" /> Add Payment Method
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}

function MoreVertical({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
  );
}
