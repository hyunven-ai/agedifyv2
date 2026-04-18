"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const THEME_PRESETS = {
  violet: { name: 'Violet', primary: '#8b5cf6', secondary: '#06b6d4', label: 'V' },
  blue:   { name: 'Blue',   primary: '#3b82f6', secondary: '#60a5fa', label: 'B' },
  emerald:{ name: 'Emerald',primary: '#10b981', secondary: '#34d399', label: 'E' },
  rose:   { name: 'Rose',   primary: '#f43f5e', secondary: '#ec4899', label: 'R' },
  amber:  { name: 'Amber',  primary: '#f59e0b', secondary: '#ef4444', label: 'A' },
};

const defaultTheme = {
  isDark: true,
  toggleTheme: () => {},
  preset: 'violet',
  changePreset: () => {},
  presets: THEME_PRESETS,
  currentPreset: THEME_PRESETS.violet,
};

const ThemeContext = createContext(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

const applyPreset = (presetId) => {
  const preset = THEME_PRESETS[presetId];
  if (!preset) return;
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', preset.primary);
  root.style.setProperty('--theme-secondary', preset.secondary);
  root.setAttribute('data-preset', presetId);
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [preset, setPreset] = useState('violet');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('agedify-theme');
      const savedPreset = localStorage.getItem('agedify-preset') || 'violet';
      const prefersDark = savedTheme ? savedTheme === 'dark' : true;
      setIsDark(prefersDark);
      setPreset(savedPreset);
      document.documentElement.classList.toggle('dark', prefersDark);
      applyPreset(savedPreset);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('agedify-theme', newTheme ? 'dark' : 'light');
  };

  const changePreset = (presetId) => {
    if (!THEME_PRESETS[presetId]) return;
    setPreset(presetId);
    applyPreset(presetId);
    localStorage.setItem('agedify-preset', presetId);
  };

  const value = {
    isDark,
    toggleTheme,
    preset,
    changePreset,
    presets: THEME_PRESETS,
    currentPreset: THEME_PRESETS[preset],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
