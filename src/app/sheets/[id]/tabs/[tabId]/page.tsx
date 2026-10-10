'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, List, Grid, Check, Link as LinkIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function TabRecords() {
  const params = useParams();
  const id = params.id as string;
  const tabId = params.tabId as string;
  
  const [schema, setSchema] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id && tabId) {
      fetchData();
    }
  }, [id, tabId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sheets/${id}/tabs/${tabId}/records`);
      if (res.ok) {
        const data = await res.json();
        setSchema(data.schema || []);
        setRecords(data.records || []);
        setTitle(data.title || 'Tab Details');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingRecordId(record.id);
      setFormData({ ...record });
    } else {
      setEditingRecordId(null);
      const initialData: any = {};
      schema.forEach(field => {
        if (field.name !== 'id') {
          initialData[field.name] = field.defaultValue || '';
        }
      });
      setFormData(initialData);
    }
    setIsModalOpen(true);
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let res;
      if (editingRecordId) {
        res = await fetch(`/api/sheets/${id}/tabs/${tabId}/records/${editingRecordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetch(`/api/sheets/${id}/tabs/${tabId}/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save record');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const res = await fetch(`/api/sheets/${id}/tabs/${tabId}/records/${recordId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete record');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting record');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/f/${id}/${tabId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderInput = (field: any) => {
    if (field.name === 'id') return null; // ID is managed automatically
    
    const commonClasses = "w-full px-3 py-2 border border-border rounded-md bg-background";
    
    if (field.type === 'enum' && field.options) {
      const opts = field.options.split(',').map((o: string) => o.trim());
      return (
        <select
          required={field.required}
          value={formData[field.name] || ''}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          className={commonClasses}
        >
          <option value="">Select...</option>
          {opts.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'bool') {
      return (
        <input
          type="checkbox"
          checked={formData[field.name] === 'true' || formData[field.name] === true}
          onChange={(e) => handleFieldChange(field.name, e.target.checked)}
          className="mt-2"
        />
      );
    }

    if (field.type === 'text') {
      return (
        <textarea
          required={field.required}
          value={formData[field.name] || ''}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          className={commonClasses}
          rows={3}
        />
      );
    }

    return (
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        required={field.required}
        min={field.min || undefined}
        max={field.max || undefined}
        value={formData[field.name] || ''}
        onChange={(e) => handleFieldChange(field.name, e.target.value)}
        className={commonClasses}
      />
    );
  };

  return (
    <div className="min-h-screen p-8 transition-colors bg-background text-foreground">
      <header className="mb-8">
        <Link href={`/sheets/${id}`} className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-4">
          <ArrowLeft size={16} className="mr-1" /> Back to Tabs
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{loading ? 'Loading...' : title} Data</h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-background border border-border rounded p-1">
              <button
                onClick={() => setView('table')}
                className={`p-1 rounded ${view === 'table' ? 'bg-card shadow' : ''}`}
                title="Table View"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-1 rounded ${view === 'grid' ? 'bg-card shadow' : ''}`}
                title="Grid View"
              >
                <Grid size={18} />
              </button>
            </div>
            
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${copied ? 'bg-green-500 text-white' : 'bg-background border border-border hover:bg-card'}`}
              title="Copy Public Form Link"
            >
              {copied ? <Check size={18} /> : <LinkIcon size={18} />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share Form'}</span>
            </button>

            <button
              onClick={() => handleOpenModal()}
              disabled={loading || schema.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Plus size={18} /> Add Record
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading records...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-border rounded-lg">
          No records found. Click "Add Record" to start.
        </div>
      ) : view === 'table' ? (
        <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-card text-foreground border-b border-border">
              <tr>
                {schema.filter(f => f.name !== 'id').map(field => (
                  <th key={field.name} className="px-4 py-3 font-semibold">
                    {field.name}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-background/50 transition-colors">
                  {schema.filter(f => f.name !== 'id').map(field => (
                    <td key={field.name} className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {record[field.name]?.toString() || '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleOpenModal(record)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete"
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
          {records.map((record, index) => (
            <div key={record.id || index} className="p-6 border border-border rounded-lg shadow-sm bg-card flex flex-col gap-3 relative group">
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(record)}
                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-2 p-1 bg-background rounded-md shadow-sm border border-border"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="text-red-500 hover:text-red-700 p-1 bg-background rounded-md shadow-sm border border-border"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="space-y-2 mt-2">
                {schema.filter(f => f.name !== 'id').map(field => (
                  <div key={field.name} className="flex justify-between border-b border-border/50 pb-1">
                    <span className="text-xs text-gray-500 font-medium">{field.name}</span>
                    <span className="text-sm font-semibold">{record[field.name]?.toString() || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl my-8">
            <h2 className="text-xl font-bold mb-4">{editingRecordId ? 'Edit Record' : 'Add New Record'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {schema.filter(f => f.name !== 'id').map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">
                    {field.name} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderInput(field)}
                  {field.type === 'number' && (field.min || field.max) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {field.min && `Min: ${field.min}`} {field.max && `Max: ${field.max}`}
                    </p>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-border hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
