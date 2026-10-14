'use client';

import { useState, useEffect, use, Suspense, useRef } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, List, Grid, Check, Link as LinkIcon, Loader2, Search, X, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

function TabRecordsContent({ params: paramsPromise }: { params: Promise<{ id: string; tabId: string }> }) {
  const params = use(paramsPromise);
  const id = params.id as string;
  const tabId = params.tabId as string;
  
  const [schema, setSchema] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    const currentQ = searchParams.get('q') || searchParams.get('search') || '';
    setSearchQuery(currentQ);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentParam = searchParams.get('q') || searchParams.get('search') || '';
      if (searchQuery !== currentParam) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery.trim()) {
          params.set('q', searchQuery.trim());
        } else {
          params.delete('q');
          params.delete('search');
        }
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, pathname, router, searchParams]);

  const filteredRecords = records.filter(record => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return Object.entries(record).some(([key, val]) => {
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(term);
    });
  });

  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);

  // Load hidden columns preference
  useEffect(() => {
    if (typeof window !== 'undefined' && id && tabId) {
      try {
        const saved = localStorage.getItem(`yope_hidden_cols_${id}_${tabId}`);
        setHiddenColumns(saved ? JSON.parse(saved) : []);
      } catch (e) {
        console.error('Failed to load hidden columns:', e);
        setHiddenColumns([]);
      }
    }
  }, [id, tabId]);

  // Handle clicking outside columns dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnsDropdownRef.current && !columnsDropdownRef.current.contains(event.target as Node)) {
        setIsColumnsDropdownOpen(false);
      }
    }
    if (isColumnsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isColumnsDropdownOpen]);

  const toggleColumn = (columnName: string) => {
    setHiddenColumns(prev => {
      const next = prev.includes(columnName)
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName];
      if (typeof window !== 'undefined' && id && tabId) {
        try {
          localStorage.setItem(`yope_hidden_cols_${id}_${tabId}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const showAllColumns = () => {
    setHiddenColumns([]);
    if (typeof window !== 'undefined' && id && tabId) {
      try {
        localStorage.removeItem(`yope_hidden_cols_${id}_${tabId}`);
      } catch {}
    }
  };

  const allFields = schema.filter(f => f.name !== 'id');
  const visibleSchema = allFields.filter(f => !hiddenColumns.includes(f.name));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [copied, setCopied] = useState(false);

  // Persist view preference in localStorage
  useEffect(() => {
    try {
      const savedView = localStorage.getItem('yope_tab_records_view');
      if (savedView === 'table' || savedView === 'grid') {
        setView(savedView);
      }
    } catch {}
  }, []);

  const handleViewChange = (newView: 'table' | 'grid') => {
    setView(newView);
    try {
      localStorage.setItem('yope_tab_records_view', newView);
    } catch {}
  };

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
    <div className="min-h-screen p-4 sm:p-8 transition-colors bg-background text-foreground">
      <header className="mb-8">
        <Link href={`/sheets/${id}`} className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-4">
          <ArrowLeft size={16} className="mr-1" /> Back to Tabs
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold break-all">{loading ? 'Loading...' : title} Data</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search records..."
                className="w-full pl-9 pr-8 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
              {/* Columns Visibility Dropdown */}
              <div className="relative" ref={columnsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsColumnsDropdownOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border transition-all ${
                    hiddenColumns.length > 0
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
                      : 'bg-background border-border text-foreground hover:bg-card'
                  }`}
                  title="Select visible columns"
                >
                  {hiddenColumns.length > 0 ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span className="hidden sm:inline">Columns</span>
                  {allFields.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-background/80 border border-border/80 font-medium ml-0.5">
                      {visibleSchema.length}/{allFields.length}
                    </span>
                  )}
                </button>

                {isColumnsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Eye size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Visible Columns</span>
                      </div>
                      {hiddenColumns.length > 0 && (
                        <button
                          type="button"
                          onClick={showAllColumns}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                          Show all
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                      {allFields.map(field => {
                        const isVisible = !hiddenColumns.includes(field.name);
                        return (
                          <button
                            key={field.name}
                            type="button"
                            onClick={() => toggleColumn(field.name)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-foreground hover:bg-background/80 transition-colors group text-left"
                          >
                            <span className={`truncate mr-2 ${isVisible ? 'font-medium' : 'text-muted-foreground line-through opacity-70'}`}>
                              {field.name}
                            </span>
                            <span className="shrink-0 text-muted-foreground group-hover:text-foreground">
                              {isVisible ? (
                                <Eye size={16} className="text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <EyeOff size={16} className="text-muted-foreground opacity-60" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex bg-background border border-border rounded p-1">
                <button
                  onClick={() => handleViewChange('table')}
                  className={`p-1 rounded ${view === 'table' ? 'bg-card shadow' : ''}`}
                  title="Table View"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => handleViewChange('grid')}
                  className={`p-1 rounded ${view === 'grid' ? 'bg-card shadow' : ''}`}
                  title="Grid View"
                >
                  <Grid size={18} />
                </button>
              </div>
              
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 border ${
                  copied 
                    ? 'bg-green-500 border-green-500 text-white font-medium' 
                    : 'bg-background border-border text-foreground hover:bg-card'
                }`}
                title="Copy Public Form Link"
              >
                {copied ? <Check size={18} className="text-white" /> : <LinkIcon size={18} />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share Form'}</span>
              </button>

              <button
                onClick={() => handleOpenModal()}
                disabled={loading || schema.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Plus size={18} /> <span className="whitespace-nowrap">Add Record</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading records...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-border rounded-lg">
          No records found. Click &ldquo;Add Record&rdquo; to start.
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2">
          <p>No records found matching &ldquo;{searchQuery}&rdquo;</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Clear search filter
          </button>
        </div>
      ) : view === 'table' ? (
        <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-card text-foreground border-b border-border">
              <tr>
                {visibleSchema.map(field => (
                  <th key={field.name} className="px-4 py-3 font-semibold group/th">
                    <div className="flex items-center justify-between gap-2">
                      <span>{field.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleColumn(field.name)}
                        className="opacity-0 group-hover/th:opacity-100 text-muted-foreground hover:text-foreground p-1 rounded transition-opacity"
                        title={`Hide ${field.name} column`}
                      >
                        <EyeOff size={14} />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleSchema.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                    All columns are currently hidden.{' '}
                    <button
                      type="button"
                      onClick={showAllColumns}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-1"
                    >
                      Show all columns
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-background/50 transition-colors">
                    {visibleSchema.map(field => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredRecords.map((record, index) => (
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
                {visibleSchema.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    All columns hidden.{' '}
                    <button
                      type="button"
                      onClick={showAllColumns}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Show all
                    </button>
                  </div>
                ) : (
                  visibleSchema.map(field => (
                    <div key={field.name} className="flex justify-between border-b border-border/50 pb-1">
                      <span className="text-xs text-gray-500 font-medium">{field.name}</span>
                      <span className="text-sm font-semibold">{record[field.name]?.toString() || '-'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 pt-16 z-50 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl mb-8 mt-4">
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

export default function TabRecords({ params }: { params: Promise<{ id: string; tabId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors p-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <TabRecordsContent params={params} />
    </Suspense>
  );
}
