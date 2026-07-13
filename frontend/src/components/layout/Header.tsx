'use client';

import Link from "next/link";
import { Search, Menu, Bell } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export function Header() {
  const { language, setLanguage, t } = useLanguage();

  const toggleMobileMenu = () => {
    window.dispatchEvent(new Event('toggle-mobile-sidebar'));
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-3 sm:px-6 shrink-0">
      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors active:scale-95"
          aria-label="Menyuni ochish"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={t('header.search')} 
            className="pl-9 pr-3 py-1.5 sm:py-2 bg-muted rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/50 w-32 sm:w-64 md:w-80 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'uz' | 'ru' | 'en')}
          className="bg-transparent text-xs sm:text-sm border border-border rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option value="uz">UZ</option>
          <option value="ru">RU</option>
          <option value="en">EN</option>
        </select>
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <Link href="/login" className="hidden sm:block text-xs sm:text-sm font-medium hover:text-primary transition-colors">
          {t('header.logout')}
        </Link>
      </div>
    </header>
  );
}
