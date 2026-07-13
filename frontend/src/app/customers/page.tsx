"use client";

import { Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function CustomersPage() {
  const { t } = useLanguage();

  return (
    <div className="p-6 md:p-10 flex flex-col h-full items-center justify-center text-center">
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
        <Users className="h-8 w-8" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-2">{t('modules.customersTitle')}</h2>
      <p className="text-muted-foreground max-w-md">
        {t('modules.customersDesc')}
      </p>
    </div>
  );
}
