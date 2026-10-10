'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ArrowLeft, Plus, Table2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SheetDetails() {
  const params = useParams();
  const id = params.id as string;
  
  const [tabs, setTabs] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [addingTab, setAddingTab] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTabs();
    }
  }, [id]);

  const fetchTabs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sheets/${id}/tabs`);
      if (res.ok) {
        const data = await res.json();
        setTabs(data.tabs || []);
        setTitle(data.title || 'Spreadsheet');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to fetch tabs');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTab = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTab(true);
    try {
      const res = await fetch(`/api/sheets/${id}/tabs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTabName }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewTabName('');
        fetchTabs();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create tab');
      }
    } finally {
      setAddingTab(false);
    }
  };

  return (
    <div className="min-h-screen p-8 transition-colors bg-background text-foreground">
      <header className="mb-8">
        <Link href="/" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-4">
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{loading ? 'Loading...' : title}</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Plus size={18} /> New Tab
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading tabs...</div>
      ) : tabs.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-border rounded-lg">
          No tabs found in this spreadsheet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {tabs.map(tab => (
            <div key={tab.sheetId} className="p-6 border border-border rounded-lg shadow-sm bg-card flex flex-col gap-3">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Table2 size={20} className="text-indigo-500" />
                {tab.title}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <p>ID: {tab.sheetId}</p>
                <p>Rows: {tab.rowCount}</p>
                <p>Columns: {tab.columnCount}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create New Tab</h2>
            <form onSubmit={handleAddTab} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tab Name</label>
                <input
                  required
                  type="text"
                  value={newTabName}
                  onChange={e => setNewTabName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="e.g. 2026 Data"
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
                  disabled={addingTab}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addingTab ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
