'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Plus, List, Grid, LogOut, Edit2, Trash2, Table2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function Dashboard({ user, clientEmail }: { user: any; clientEmail: string }) {
  const { theme, setTheme } = useTheme();
  const [sheets, setSheets] = useState<any[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [newSheetId, setNewSheetId] = useState('');
  const [newSheetName, setNewSheetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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
        body: JSON.stringify({ sheet_id: newSheetId }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewSheetId('');
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
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
    window.location.reload();
  };

  const handleEditSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/sheets/${editingSheetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet_name: newSheetName }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setNewSheetName('');
        setEditingSheetId(null);
        fetchSheets();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to edit sheet');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sheetIdToDel: string) => {
    if (!confirm('Are you sure you want to disconnect this sheet?')) return;
    try {
      const res = await fetch(`/api/sheets/${sheetIdToDel}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchSheets();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete sheet');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting sheet');
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 transition-colors">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold break-all">Welcome, {user.username}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition">
            Profile
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold">Your Connected Sheets</h2>
        <div className="flex flex-wrap items-center gap-3">
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
      ) : view === 'list' ? (
        <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-card text-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Sheet Name</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sheets.map(sheet => (
                <tr key={sheet.uuid} className="hover:bg-background/50 transition-colors cursor-pointer group" onClick={() => router.push(`/sheets/${sheet.sheet_id}`)}>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium group-hover:text-indigo-500 transition-colors flex items-center gap-2">
                    <Table2 size={16} className="text-indigo-500" />
                    {sheet.title || sheet.sheet_name}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingSheetId(sheet.uuid); setNewSheetName(sheet.title || sheet.sheet_name); setIsEditModalOpen(true); }}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(sheet.uuid); }}
                      className="text-red-500 hover:text-red-700"
                      title="Disconnect"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sheets.map(sheet => (
            <div
              key={sheet.uuid}
              onClick={() => router.push(`/sheets/${sheet.sheet_id}`)}
              className="p-6 border border-border rounded-lg shadow-sm bg-card flex flex-col gap-2 cursor-pointer hover:border-indigo-500 transition-colors group relative"
            >
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingSheetId(sheet.uuid); setNewSheetName(sheet.title || sheet.sheet_name); setIsEditModalOpen(true); }}
                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-2 p-1 bg-background rounded-md shadow-sm border border-border"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(sheet.uuid); }}
                  className="text-red-500 hover:text-red-700 p-1 bg-background rounded-md shadow-sm border border-border"
                  title="Disconnect"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="font-semibold text-lg group-hover:text-indigo-500 transition-colors mt-4">{sheet.title || sheet.sheet_name}</h3>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl my-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">Connect New Sheet</h2>

            <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
              <h3 className="font-semibold text-sm text-indigo-800 dark:text-indigo-300 mb-2">Share Your Sheet</h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 mb-3 leading-relaxed">
                Open your Google Sheet, click <strong>Share</strong>, and paste the email below. Grant it <strong>Editor</strong> access so we can read and write data.
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs flex-1 bg-white dark:bg-black/50 p-2 rounded border border-indigo-200 dark:border-indigo-700 break-all select-all">
                  {clientEmail}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(clientEmail);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded flex items-center gap-1 transition ${copied
                      ? 'bg-green-500 text-white'
                      : 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-700'
                    }`}
                >
                  {copied ? (
                    <>
                      <Check size={14} /> Copied!
                    </>
                  ) : (
                    'Copy'
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleConnectSheet} className="space-y-4">
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
                <p className="text-xs text-muted-foreground mt-1">
                  You can find this in your Google Sheet URL between /d/ and /edit
                </p>
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

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-foreground">Edit Sheet Name</h2>
            <form onSubmit={handleEditSheet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Sheet Name</label>
                <input
                  required
                  type="text"
                  value={newSheetName}
                  onChange={e => setNewSheetName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-border hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
