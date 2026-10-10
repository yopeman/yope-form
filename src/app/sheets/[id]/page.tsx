'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ArrowLeft, Plus, Table2, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Field = {
  id: string;
  name: string;
  type: string;
  min: string;
  max: string;
  required: boolean;
  options: string;
  defaultValue: string;
};

export default function SheetDetails() {
  const params = useParams();
  const id = params.id as string;
  
  const [tabs, setTabs] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [addingTab, setAddingTab] = useState(false);
  
  const [fields, setFields] = useState<Field[]>([
    { id: '1', name: 'id', type: 'uuid', min: '', max: '', required: true, options: '', defaultValue: '' }
  ]);

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

  const handleAddField = () => {
    setFields([
      ...fields, 
      { id: Date.now().toString(), name: '', type: 'string', min: '', max: '', required: false, options: '', defaultValue: '' }
    ]);
  };

  const handleRemoveField = (fieldId: string) => {
    if (fieldId === '1') return; // Don't remove the id field
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const handleFieldChange = (fieldId: string, key: keyof Field, value: any) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f));
  };

  const handleAddTab = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTab(true);
    try {
      const res = await fetch(`/api/sheets/${id}/tabs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTabName, fields }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewTabName('');
        setFields([{ id: '1', name: 'id', type: 'uuid', min: '', max: '', required: true, options: '', defaultValue: '' }]);
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
                <p>Rows: {tab.rowCount}</p>
                <p>Columns: {tab.columnCount}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl max-w-3xl w-full p-6 shadow-xl my-8">
            <h2 className="text-xl font-bold mb-4">Create New Tab with Schema</h2>
            <form onSubmit={handleAddTab} className="space-y-6">
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

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Schema Fields</label>
                  <button type="button" onClick={handleAddField} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                    <Plus size={14} /> Add Field
                  </button>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {fields.filter(f => f.id !== '1').map((field, index) => (
                    <div key={field.id} className="p-4 border border-border rounded-lg bg-background/50 grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                      <button type="button" onClick={() => handleRemoveField(field.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">Name</label>
                        <input
                          required
                          type="text"
                          value={field.name}
                          onChange={e => handleFieldChange(field.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                        />
                      </div>
                      
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">Type</label>
                        <select
                          value={field.type}
                          onChange={e => handleFieldChange(field.id, 'type', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                        >
                          <option value="string">String</option>
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="enum">Enum</option>
                          <option value="bool">Bool</option>
                        </select>
                      </div>

                      <div className="col-span-1 md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">Min / Max</label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="Min"
                            value={field.min}
                            onChange={e => handleFieldChange(field.id, 'min', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                          />
                          <input
                            type="text"
                            placeholder="Max"
                            value={field.max}
                            onChange={e => handleFieldChange(field.id, 'max', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                          />
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-1 flex flex-col justify-end">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e => handleFieldChange(field.id, 'required', e.target.checked)}
                          />
                          Required
                        </label>
                      </div>

                      {field.type === 'enum' && (
                        <div className="col-span-2 md:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Options (comma separated)</label>
                          <input
                            type="text"
                            value={field.options}
                            onChange={e => handleFieldChange(field.id, 'options', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                          />
                        </div>
                      )}

                      <div className={`col-span-2 md:col-span-${field.type === 'enum' ? '2' : '4'}`}>
                        <label className="block text-xs text-gray-500 mb-1">Default Value</label>
                        <input
                          type="text"
                          value={field.defaultValue}
                          onChange={e => handleFieldChange(field.id, 'defaultValue', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
                  {addingTab ? 'Creating...' : 'Create Tab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
