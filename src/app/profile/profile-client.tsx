'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Lock, Trash2, AlertTriangle, Save } from 'lucide-react';
import Link from 'next/link';

export function ProfileClient({ user }: { user: any }) {
  const [username, setUsername] = useState(user.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const router = useRouter();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage('Profile updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        router.refresh();
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and will delete all your connections.')) {
      return;
    }
    
    setDeleting(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/profile', { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete account');
        setDeleting(false);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors p-8">
      <Link href="/" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-8">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>
      <div className="max-w-2xl mx-auto">        
        <h1 className="text-3xl font-bold mb-8 text-foreground">Profile Management</h1>
        
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <User size={20} className="text-indigo-500" /> Account Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal information and credentials.</p>
          </div>
          
          <div className="p-6">
            {message && <div className="mb-6 p-3 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md text-sm">{message}</div>}
            {error && <div className="mb-6 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-sm">{error}</div>}
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Email (Cannot be changed)</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background/50 opacity-70 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
              
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Lock size={16} /> Change Password (Optional)
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Required only to set a new password"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving || (!username && !newPassword)}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
              <AlertTriangle size={20} /> Danger Zone
            </h2>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              <Trash2 size={18} /> {deleting ? 'Deleting Account...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
