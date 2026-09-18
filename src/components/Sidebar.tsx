import React from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  CalendarCheck2, 
  Sparkles, 
  RefreshCw, 
  Users, 
  Star, 
  Plus, 
  X,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Landmark,
  Download,
  Share2,
  Trash2
} from 'lucide-react';
import { ActiveTab, FormationSession, Collaborateur } from '../types';
import { calculateColdEvaluationAlerts, calculateRecyclingAlerts } from '../utils/analytics';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  sessions: FormationSession[];
  collaborateurs: Collaborateur[];
  onOpenCreateSession: () => void;
  onResetData?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenExcelSync?: () => void;
  onOpenGuideModal?: () => void;
  onDirectSave?: () => void;
  onOpenSaveReminder?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  sessions,
  collaborateurs,
  onOpenCreateSession,
  onResetData,
  isMobileOpen = false,
  onCloseMobile,
  onOpenExcelSync,
  onOpenGuideModal,
  onDirectSave,
  onOpenSaveReminder
}) => {
  const coldAlerts = calculateColdEvaluationAlerts(sessions);
  const recyclingAlerts = calculateRecyclingAlerts(sessions, collaborateurs).filter(
    (a) => a.etat === 'EXPIRE' || a.etat === 'URGENT'
  );

  const navItems: { 
    tab: ActiveTab; 
    label: string; 
    badgeCount?: number; 
    icon: React.ComponentType<{ className?: string }> 
  }[] = [
    { tab: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { tab: 'sessions', label: 'Sessions & Planning', icon: CalendarCheck2 },
    { tab: 'souhaits', label: 'Souhaits & Matching', icon: Sparkles },
    { tab: 'recyclage', label: 'Recyclages & Habilitations', badgeCount: recyclingAlerts.length, icon: RefreshCw },
    { tab: 'evaluations', label: 'Évaluations & Retours', badgeCount: coldAlerts.length, icon: Star },
    { tab: 'opco', label: 'Suivi OPCO & Financements', icon: Landmark },
    { tab: 'collaborateurs', label: 'Référentiel Salariés', icon: Users },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-stone-900/30 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Aside */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#FAFAF9] text-stone-800 flex flex-col border-r border-stone-200/80 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-stone-900 text-base">
                  Formation TABM
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-normal">
                Pilotage Formation & OPCO
              </p>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Create Action */}
        <div className="px-4 pb-3">
          <button
            id="btn-sidebar-create-session"
            onClick={() => {
              onOpenCreateSession();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Planifier une session</span>
          </button>
        </div>

        {/* Main Navigation */}
        <div className="px-4 py-2">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Espaces de travail
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;

            return (
              <button
                key={item.tab}
                id={`sidebar-tab-${item.tab}`}
                onClick={() => handleSelectTab(item.tab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-stone-200/80 text-stone-950 font-semibold shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-stone-900' : 'text-stone-400'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badgeCount && item.badgeCount > 0 ? (
                  <span 
                    className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200/60"
                  >
                    {item.badgeCount}
                  </span>
                ) : null}
              </button>
            );
          })}

          {/* Tools & Governance Section */}
          <div className="pt-4 pb-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Gouvernance & Flux
            </p>
          </div>

          {onOpenExcelSync && (
            <button
              onClick={() => {
                onOpenExcelSync();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Sauvegarder</span>
              </div>
              <ArrowUpRight className="h-3 w-3 text-stone-400" />
            </button>
          )}

          {onOpenGuideModal && (
            <button
              onClick={() => {
                onOpenGuideModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Guide Conformité RGPD</span>
              </div>
              <ArrowUpRight className="h-3 w-3 text-stone-400" />
            </button>
          )}

          {onResetData && (
            <button
              onClick={() => {
                onResetData();
                if (onCloseMobile) onCloseMobile();
              }}
              title="Effacer toutes les données locales pour repartir d'une base vierge"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="h-4 w-4 text-stone-400 group-hover:text-rose-600 shrink-0" />
                <span>Vider les données</span>
              </div>
            </button>
          )}
        </nav>

        {/* Footer info */}
        <div className="p-3.5 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-400">
          <span className="truncate">
            {sessions.length} sessions • {collaborateurs.length} salariés
          </span>
        </div>
      </aside>
    </>
  );
};
