"use client";
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = () => {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 hover:border-violet-500/40 bg-background/80 backdrop-blur-sm transition-all duration-200 text-sm font-semibold"
      title={lang === 'en' ? 'Switch to Indonesian' : 'Ganti ke English'}
      data-testid="language-toggle"
    >
      <span className={`transition-opacity ${lang === 'en' ? 'opacity-100' : 'opacity-50'}`}>EN</span>
      <span className="text-muted-foreground/40">/</span>
      <span className={`transition-opacity ${lang === 'id' ? 'opacity-100' : 'opacity-50'}`}>ID</span>
    </button>
  );
};

export default LanguageToggle;
