'use client';

import { useState, useEffect, use, Suspense, useRef } from 'react';
import { useTheme } from 'next-themes';
import { ArrowLeft, Plus, Table2, Trash2, Edit2, List, Grid, Loader2, Search, X, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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

function SheetDetailsContent({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const id = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [tabs, setTabs] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filteredTabs = tabs.filter(tab => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (tab.title || '').toLowerCase().includes(term);
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState('');
  const [addingTab, setAddingTab] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>('grid');

  // Persist view preference
  useEffect(() => {
    try {
      const savedView = localStorage.getItem('yope_sheet_tabs_view');
      if (savedView === 'grid' || savedView === 'table') {
        setView(savedView);
      }
    } catch {}
  }, []);

  const handleViewChange = (newView: 'grid' | 'table') => {
    setView(newView);
    try {
      localStorage.setItem('yope_sheet_tabs_view', newView);
    } catch {}
  };

  // Column toggling for tabs table
  const tabColumns = [
    { key: 'title', label: 'Title' },
    { key: 'rowCount', label: 'Rows' },
    { key: 'columnCount', label: 'Columns' },
  ];
  const [hiddenTabColumns, setHiddenTabColumns] = useState<string[]>([]);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      try {
        const saved = localStorage.getItem(`yope_hidden_tab_cols_${id}`);
        setHiddenTabColumns(saved ? JSON.parse(saved) : []);
      } catch {
        setHiddenTabColumns([]);
      }
    }
  }, [id]);

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

  const toggleTabColumn = (colKey: string) => {
    setHiddenTabColumns(prev => {
      const next = prev.includes(colKey) ? prev.filter(c => c !== colKey) : [...prev, colKey];
      if (typeof window !== 'undefined' && id) {
        try {
          localStorage.setItem(`yope_hidden_tab_cols_${id}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const showAllTabColumns = () => {
    setHiddenTabColumns([]);
    if (typeof window !== 'undefined' && id) {
      try {
        localStorage.removeItem(`yope_hidden_tab_cols_${id}`);
      } catch {}
    }
  };

  const isColVisible = (colKey: string) => !hiddenTabColumns.includes(colKey);
  const visibleColCount = tabColumns.filter(c => isColVisible(c.key)).length;

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

  const handleSaveTab = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTab(true);
    try {
      const url = editingTabId ? `/api/sheets/${id}/tabs/${editingTabId}` : `/api/sheets/${id}/tabs`;
      const method = editingTabId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTabName, fields }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewTabName('');
        setEditingTabId(null);
        setFields([{ id: '1', name: 'id', type: 'uuid', min: '', max: '', required: true, options: '', defaultValue: '' }]);
        fetchTabs();
      } else {
        const err = await res.json();
        alert(err.error || `Failed to ${editingTabId ? 'update' : 'create'} tab`);
      }
    } finally {
      setAddingTab(false);
    }
  };

  const handleEditClick = async (tabId: string, tabTitle: string) => {
    setEditingTabId(tabId);
    setNewTabName(tabTitle);

    try {
      const res = await fetch(`/api/sheets/${id}/tabs/${tabId}/records`);
      if (res.ok) {
        const data = await res.json();
        if (data.schema && data.schema.length > 0) {
          setFields(data.schema.map((f: any, idx: number) => ({
            id: (idx + 1).toString(),
            name: f.name,
            type: f.type,
            min: f.min,
            max: f.max,
            required: f.required,
            options: f.options,
            defaultValue: f.defaultValue
          })));
        }
      }
    } catch (e) {
      console.error(e);
    }

    setIsModalOpen(true);
  };

  const handleDelete = async (tabIdToDel: string) => {
    if (!confirm('Are you sure you want to delete this tab?')) return;
    try {
      const res = await fetch(`/api/sheets/${id}/tabs/${tabIdToDel}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTabs();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete tab');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting tab');
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 transition-colors bg-background text-foreground">
      <header className="mb-8">
        <Link href="/" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-4">
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold break-all">{loading ? 'Loading...' : title}</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tabs..."
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
                    hiddenTabColumns.length > 0
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
                      : 'bg-background border-border text-foreground hover:bg-card'
                  }`}
                  title="Select visible columns"
                >
                  {hiddenTabColumns.length > 0 ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span className="hidden sm:inline">Columns</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-background/80 border border-border/80 font-medium ml-0.5">
                    {visibleColCount}/{tabColumns.length}
                  </span>
                </button>

                {isColumnsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Eye size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Visible Columns</span>
                      </div>
                      {hiddenTabColumns.length > 0 && (
                        <button
                          type="button"
                          onClick={showAllTabColumns}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                          Show all
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {tabColumns.map(col => {
                        const isVisible = isColVisible(col.key);
                        return (
                          <button
                            key={col.key}
                            type="button"
                            onClick={() => toggleTabColumn(col.key)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-foreground hover:bg-background/80 transition-colors group text-left"
                          >
                            <span className={`truncate mr-2 ${isVisible ? 'font-medium' : 'text-muted-foreground line-through opacity-70'}`}>
                              {col.label}
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
            </div>
            <button
              onClick={() => {
                setEditingTabId(null);
                setNewTabName('');
                setFields([{ id: '1', name: 'id', type: 'uuid', min: '', max: '', required: true, options: '', defaultValue: '' }]);
                setIsModalOpen(true);
              }}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Plus size={18} /> New Tab
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading tabs...</div>
      ) : tabs.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-border rounded-lg">
          No tabs found in this spreadsheet.
        </div>
      ) : filteredTabs.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2">
          <p>No tabs found matching &ldquo;{searchQuery}&rdquo;</p>
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
                {isColVisible('title') && (
                  <th className="px-4 py-3 font-semibold group/th">
                    <div className="flex items-center justify-between gap-2">
                      <span>Title</span>
                      <button
                        type="button"
                        onClick={() => toggleTabColumn('title')}
                        className="opacity-0 group-hover/th:opacity-100 text-muted-foreground hover:text-foreground p-1 rounded transition-opacity"
                        title="Hide Title column"
                      >
                        <EyeOff size={14} />
                      </button>
                    </div>
                  </th>
                )}
                {isColVisible('rowCount') && (
                  <th className="px-4 py-3 font-semibold group/th">
                    <div className="flex items-center justify-between gap-2">
                      <span>Rows</span>
                      <button
                        type="button"
                        onClick={() => toggleTabColumn('rowCount')}
                        className="opacity-0 group-hover/th:opacity-100 text-muted-foreground hover:text-foreground p-1 rounded transition-opacity"
                        title="Hide Rows column"
                      >
                        <EyeOff size={14} />
                      </button>
                    </div>
                  </th>
                )}
                {isColVisible('columnCount') && (
                  <th className="px-4 py-3 font-semibold group/th">
                    <div className="flex items-center justify-between gap-2">
                      <span>Columns</span>
                      <button
                        type="button"
                        onClick={() => toggleTabColumn('columnCount')}
                        className="opacity-0 group-hover/th:opacity-100 text-muted-foreground hover:text-foreground p-1 rounded transition-opacity"
                        title="Hide Columns column"
                      >
                        <EyeOff size={14} />
                      </button>
                    </div>
                  </th>
                )}
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleColCount === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                    All columns are currently hidden.{' '}
                    <button
                      type="button"
                      onClick={showAllTabColumns}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-1"
                    >
                      Show all columns
                    </button>
                  </td>
                </tr>
              ) : (
                filteredTabs.map(tab => (
                  <tr key={tab.sheetId} className="hover:bg-background/50 transition-colors cursor-pointer group" onClick={() => router.push(`/sheets/${id}/tabs/${tab.sheetId}`)}>
                    {isColVisible('title') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium group-hover:text-indigo-500 transition-colors flex items-center gap-2">
                        <Table2 size={16} className="text-indigo-500" />
                        {tab.title}
                      </td>
                    )}
                    {isColVisible('rowCount') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{tab.rowCount}</td>
                    )}
                    {isColVisible('columnCount') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{tab.columnCount}</td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditClick(tab.sheetId, tab.title); }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(tab.sheetId); }}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {filteredTabs.map(tab => (
            <div
              key={tab.sheetId}
              onClick={() => router.push(`/sheets/${id}/tabs/${tab.sheetId}`)}
              className="p-6 border border-border rounded-lg shadow-sm bg-card flex flex-col gap-3 cursor-pointer hover:border-indigo-500 transition-colors group relative"
            >
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditClick(tab.sheetId, tab.title); }}
                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-2 p-1 bg-background rounded-md shadow-sm border border-border"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(tab.sheetId); }}
                  className="text-red-500 hover:text-red-700 p-1 bg-background rounded-md shadow-sm border border-border"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-lg font-semibold group-hover:text-indigo-500 transition-colors mt-2">
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
            <h2 className="text-xl font-bold mb-4">{editingTabId ? 'Edit Tab & Schema' : 'Create New Tab with Schema'}</h2>
            <form onSubmit={handleSaveTab} className="space-y-6">
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
                  disabled={addingTab || fields.length === 0}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addingTab ? 'Saving...' : (editingTabId ? 'Save Changes' : 'Create Tab')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SheetDetails({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors p-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <SheetDetailsContent params={params} />
    </Suspense>
  );
}
