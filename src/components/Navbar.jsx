import React from 'react';
import {
  CalendarDays,
  BookOpen,
  ShoppingCart,
  UtensilsCrossed,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';

export default function Navbar({
  activeTab,
  onTabChange,
  plannedDishesCount,
  recipesCount,
  definitiveShoppingCount,
  syncStatus,
  onOpenSyncModal,
}) {
  const navItems = [
    {
      id: 'calendar',
      label: 'Calendario',
      fullLabel: 'Calendario Semanal',
      icon: CalendarDays,
      badge: plannedDishesCount,
      badgeTone: 'bg-slate-100 text-slate-700',
      activeBadgeTone: 'bg-emerald-600 text-white',
    },
    {
      id: 'recipes',
      label: 'Recetas',
      fullLabel: 'Recetas',
      icon: BookOpen,
      badge: recipesCount,
      badgeTone: 'bg-slate-100 text-slate-700',
      activeBadgeTone: 'bg-emerald-600 text-white',
    },
    {
      id: 'shopping',
      label: 'Compra',
      fullLabel: 'Lista de la Compra',
      icon: ShoppingCart,
      badge: definitiveShoppingCount,
      badgeTone: definitiveShoppingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600',
      activeBadgeTone: 'bg-emerald-600 text-white',
    },
  ];

  const syncBadge = (() => {
    if (syncStatus === 'saving') {
      return {
        label: 'Guardando...',
        shortLabel: 'Guardando',
        className: 'border-sky-200 bg-sky-50 text-sky-700',
        Icon: RefreshCw,
        spin: true,
      };
    }
    if (syncStatus === 'syncing') {
      return {
        label: 'Sincronizando...',
        shortLabel: 'Sincroniz.',
        className: 'border-sky-200 bg-sky-50 text-sky-700',
        Icon: RefreshCw,
        spin: true,
      };
    }
    if (syncStatus === 'offline') {
      return {
        label: 'Sin conexión · Reintentar',
        shortLabel: 'Offline',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
        Icon: CloudOff,
        spin: false,
      };
    }
    return {
      label: 'Sincronizado · Miguel y Rosa',
      shortLabel: 'Compartido',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
      Icon: Cloud,
      spin: false,
    };
  })();

  const SyncIcon = syncBadge.Icon;

  return (
    <>
      <header className="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onTabChange('calendar')}
              className="flex items-center gap-3 text-left focus:outline-none"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-lg font-extrabold tracking-tight text-slate-900">
                  MenuPlan
                </span>
                <span className="hidden text-xs font-medium text-slate-500 sm:block">
                  Menú compartido para 2 personas
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSyncModal}
              title="Estado de sincronización compartida entre dispositivos"
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition ${syncBadge.className}`}
            >
              <SyncIcon className={`h-3.5 w-3.5 ${syncBadge.spin ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{syncBadge.label}</span>
              <span className="md:hidden">{syncBadge.shortLabel}</span>
            </button>

            <nav aria-label="Navegación principal" className="hidden items-center gap-1.5 sm:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span>{item.fullLabel}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                        isActive ? item.activeBadgeTone : item.badgeTone
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <nav
        aria-label="Navegación móvil"
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md sm:hidden"
      >
        <div className="grid grid-cols-3 gap-1 px-2 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge > 0 && (
                    <span
                      className={`absolute -right-3 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
