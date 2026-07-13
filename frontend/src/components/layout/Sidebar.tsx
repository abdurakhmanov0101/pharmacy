"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Pill,
  DollarSign,
  Users,
  Package,
  FileText,
  BarChart3,
  Bell,
  Bot,
  Camera,
  ShieldAlert,
  UserCircle,
  CreditCard,
  Calendar,
  MapPin,
  Settings
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navGroups = [
    {
      label: "Asosiy",
      items: [
        { href: "/", icon: <Activity />, label: "Asosiy oyna" },
        { href: "/pos", icon: <DollarSign />, label: "Sotuv (POS)" },
      ],
    },
    {
      label: "Katalog",
      items: [
        { href: "/medicines", icon: <Pill />, label: "Dorilar" },
        { href: "/inventory", icon: <Package />, label: "Ombor" },
      ],
    },
    {
      label: "Savdo & Moliya",
      items: [
        { href: "/sales", icon: <FileText />, label: "Sotuvlar tarixi" },
        { href: "/expenses", icon: <CreditCard />, label: "Kassa & Chiqimlar (Foyda)" },
        { href: "/customers", icon: <Users />, label: "Mijozlar" },
      ],
    },
    {
      label: "Boshqaruv & HR",
      items: [
        { href: "/employees", icon: <UserCircle />, label: "Xodimlar Ro'yxati" },
        { href: "/payroll", icon: <CreditCard />, label: "Oylik Maoshlar" },
        { href: "/leave", icon: <Calendar />, label: "Ta'tillar" },
        { href: "/attendance/camera", icon: <Camera />, label: "Davomat Kamerasi" },
        { href: "/security-alerts", icon: <ShieldAlert />, label: "Xavfsizlik Jurnali" },
        { href: "/telegram", icon: <Bot />, label: "Telegram Bot" },
      ],
    },
    {
      label: "Tahlil",
      items: [
        { href: "/reports", icon: <BarChart3 />, label: "Hisobotlar" },
        { href: "/alerts", icon: <Bell />, label: "Ogohlantirishlar" },
      ],
    },
    {
      label: "Sozlamalar",
      items: [
        { href: "/branches", icon: <MapPin />, label: "Filiallar" },
        { href: "/settings", icon: <Settings />, label: "Sozlamalar" },
      ],
    }
  ];

  const sidebarContent = (
    <>
      <div className="p-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-xl font-bold text-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span>AptekaOS</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1 ml-10">Apteka boshqaruv tizimi</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-lg"
          aria-label="Menyuni yopish"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-4 overflow-y-auto pb-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            SA
          </div>
          <div>
            <p className="text-sm font-medium">Super Admin</p>
            <p className="text-xs text-muted-foreground">admin@aptekaos.uz</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          />
          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-card border-r border-border flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="w-4 h-4">{icon}</div>
      {label}
    </Link>
  );
}
