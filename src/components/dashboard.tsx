'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Plus, List, Grid, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Dashboard({ user }: { user: any }) {
  const { theme, setTheme } = useTheme();
  const [sheets, setSheets] = useState<any[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSheetId, setNewSheetId] = useState('');
  const [newSheetName, setNewSheetName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    const res = await fetch('/api/sheets');
    if (res.ok) {
      const data = await res.json();
      setSheets(data.sheets || []);
    }
  };

  const handleConnectSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet_id: newSheetId, sheet_name: newSheetName }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewSheetId('');
        setNewSheetName('');
        fetchSheets();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to connect sheet');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Clear cookie could be an API call or handled on client if not httpOnly, but since it is httpOnly we need an API route.
    // Let's assume we have /api/auth/logout
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh(); // Or redirect
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-8 transition-colors">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user.username}</h1>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Connected Sheets</h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-background border border-border rounded p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-1 rounded ${view === 'grid' ? 'bg-card shadow' : ''}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1 rounded ${view === 'list' ? 'bg-card shadow' : ''}`}
            >
              <List size={18} />
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            <Plus size={18} /> Connect Sheet
          </button>
        </div>
      </div>

      {sheets.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-border rounded-lg">
          No sheets connected yet. Click "Connect Sheet" to get started.
        </div>
      ) : (
        <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
          {sheets.map(sheet => (
            <div key={sheet.uuid} className="p-6 border border-border rounded-lg shadow-sm bg-card flex flex-col gap-2">
              <h3 className="font-semibold text-lg">{sheet.sheet_name}</h3>
              <p className="text-sm text-gray-500 break-all">{sheet.sheet_id}</p>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-foreground">Connect New Sheet</h2>
            <form onSubmit={handleConnectSheet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Sheet Name</label>
                <input
                  required
                  type="text"
                  value={newSheetName}
                  onChange={e => setNewSheetName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="e.g. My Users Data"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Spreadsheet ID</label>
                <input
                  required
                  type="text"
                  value={newSheetId}
                  onChange={e => setNewSheetId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="1BxiMVs0XRY..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-border hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
