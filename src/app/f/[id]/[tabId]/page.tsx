'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

type SchemaField = {
  name: string;
  type: string;
  min: string;
  max: string;
  required: boolean;
  options: string;
  defaultValue: string;
};

function PublicFormContent({ params: paramsPromise }: { params: Promise<{ id: string; tabId: string }> }) {
  const params = use(paramsPromise);
  const id = params.id as string;
  const tabId = params.tabId as string;

  const [title, setTitle] = useState('');
  const [schema, setSchema] = useState<SchemaField[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && tabId) {
      fetchForm();
    }
  }, [id, tabId]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/public/forms/${id}/${tabId}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title);
        setSchema(data.schema || []);
        
        // initialize default values
        const initialData: any = {};
        data.schema.forEach((f: SchemaField) => {
          if (f.name !== 'id') {
            initialData[f.name] = f.defaultValue || '';
          }
        });
        setFormData(initialData);
      } else {
        setError('Failed to load form or form does not exist.');
      }
    } catch (e) {
      setError('Network error while loading form.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // prepare payload
    const payload = { ...formData };
    payload.id = crypto.randomUUID();

    try {
      const res = await fetch(`/api/public/forms/${id}/${tabId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to submit form');
      }
    } catch (e) {
      setError('An unexpected error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldInput = (field: SchemaField) => {
    const value = formData[field.name] || '';
    const onChange = (val: string) => setFormData({ ...formData, [field.name]: val });
    const onChangeCheckbox = (checked: boolean) => setFormData({ ...formData, [field.name]: checked ? 'true' : 'false' });

    if (field.type === 'enum' && field.options) {
      const opts = field.options.split(',').map(o => o.trim());
      return (
        <select
          required={field.required}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          <option value="">Select an option</option>
          {opts.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'bool') {
      return (
        <label className="flex items-center gap-2 cursor-pointer p-2 border border-border rounded-lg bg-background/50 hover:bg-background transition">
          <input
            type="checkbox"
            required={field.required}
            checked={value === 'true'}
            onChange={e => onChangeCheckbox(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium">Yes / Enabled</span>
        </label>
      );
    }

    if (field.type === 'number') {
      return (
        <input
          type="number"
          required={field.required}
          min={field.min || undefined}
          max={field.max || undefined}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
      );
    }

    if (field.type === 'text') {
      return (
        <textarea
          required={field.required}
          minLength={field.min ? parseInt(field.min) : undefined}
          maxLength={field.max ? parseInt(field.max) : undefined}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
        />
      );
    }

    // Default to string
    return (
      <input
        type="text"
        required={field.required}
        minLength={field.min ? parseInt(field.min) : undefined}
        maxLength={field.max ? parseInt(field.max) : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !schema.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors p-4">
        <div className="max-w-md w-full bg-card border border-border p-8 rounded-2xl shadow-xl text-center">
          <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error Loading Form</h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors p-4">
        <div className="max-w-md w-full bg-card border border-border p-8 rounded-2xl shadow-xl text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Your response has been successfully submitted to {title}.</p>
          <button
            onClick={() => {
              setSubmitted(false);
              // Reset form data while preserving defaults
              const initialData: any = {};
              schema.forEach((f: SchemaField) => {
                if (f.name !== 'id') initialData[f.name] = f.defaultValue || '';
              });
              setFormData(initialData);
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-xl overflow-hidden relative z-10">
        <div className="bg-indigo-600 px-8 py-10 text-white">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-indigo-100 opacity-90">Please fill out the form below. All required fields are marked.</p>
        </div>
        
        <div className="p-8">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {schema.filter(f => f.name !== 'id').map(field => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label className="font-semibold text-foreground">
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1" title="Required">*</span>}
                </label>
                {renderFieldInput(field)}
              </div>
            ))}

            <div className="pt-6 mt-6 border-t border-border">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 size={20} className="animate-spin" />}
                {submitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="text-center mt-8 text-sm text-muted-foreground pb-8 relative z-10">
        Powered by Yope Forms
      </div>
    </div>
  );
}

export default function PublicForm({ params }: { params: Promise<{ id: string; tabId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors p-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <PublicFormContent params={params} />
    </Suspense>
  );
}
