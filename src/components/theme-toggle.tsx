'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, CloudMoon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const themes = ['system', 'light', 'dark', 'night'];
  
  const handleCycle = () => {
    const currentIndex = themes.indexOf(theme || 'system');
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    if (theme === 'light') return <Sun size={20} />;
    if (theme === 'dark') return <Moon size={20} />;
    if (theme === 'night') return <CloudMoon size={20} />;
    return <Monitor size={20} />;
  };

  return (
    <button
      onClick={handleCycle}
      className="p-2 rounded-full bg-card border border-border text-foreground hover:opacity-80 transition flex items-center justify-center shadow-md"
      aria-label="Toggle theme"
      title={`Current theme: ${theme}`}
    >
      {getIcon()}
    </button>
  );
}
