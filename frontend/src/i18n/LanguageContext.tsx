'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';

type Language = 'uz' | 'ru' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const dictionaries = { uz, ru, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('uz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
    const storedLang = localStorage.getItem('app_lang') as Language;
    if (storedLang && ['uz', 'ru', 'en'].includes(storedLang)) {
      setLanguageState(storedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let current: any = dictionaries[language];
    for (const k of keys) {
      if (current[k] === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      current = current[k];
    }
    return current;
  };

  if (!mounted) {
    // Return a fragment or a loading state if you want to avoid hydration mismatch
    // But wrapping children directly is fine if they don't depend on initial client-only render
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
