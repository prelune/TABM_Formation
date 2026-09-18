import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Download,
  Menu, 
  X, 
  Clock, 
  AlertTriangle, 
  ClipboardCheck, 
  CheckCircle2,
  Layers,
  Check
} from 'lucide-react';
import { ActiveTab, FormationSession, Collaborateur } from '../types';
import { 
  calculateOPCOStats, 
  calculateColdEvaluationAlerts, 
  calculateRecyclingAlerts, 
  calculateLogisticsAlerts 
} from '../utils/analytics';

interface HeaderProps {
  activeTab: ActiveTab;
  sessions: FormationSession[];
  collaborateurs: Collaborateur[];
  onOpenMobileMenu: () => void;
  onSelectSessionById?: (sessionId: string) => void;
  onOpenGuideModal?: () => void;
  onOpenExcelSyncModal?: () => void;
  onDirectSave?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  sessions,
  collaborateurs,
  onOpenMobileMenu,
  onSelectSessionById,
  onOpenGuideModal,
  onOpenExcelSyncModal,
  onDirectSave
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const opcoStats = calculateOPCOStats(sessions);
  const coldAlerts = calculateColdEvaluationAlerts(sessions);
  const recyclingAlerts = calculateRecyclingAlerts(sessions, collaborateurs).filter(
    (a) => a.etat === 'EXPIRE' || a.etat === 'URGENT'
  );
  const logisticsAlerts = calculateLogisticsAlerts(sessions);
  const totalAlerts = coldAlerts.length + recyclingAlerts.length + logisticsAlerts.length;

  const tabLabels: Record<ActiveTab, string> = {
    dashboard: 'Accueil',
    sessions: 'Sessions & Planning',
    souhaits: 'Souhaits & Matching',
    recyclage: 'Recyclages & Habilitations',
    evaluations: 'Évaluations & Retours',
    opco: 'Suivi OPCO & Financements',
    collaborateurs: 'Référentiel Salariés'
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveClick = () => {
    if (onDirectSave) {
      onDirectSave();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    }
  };

  const initials = 'RH';

  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-stone-200/80 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 sticky top-0">
      {/* Left side: Mobile menu button & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 min-w-0">
          <span className="text-stone-400 font-normal hidden sm:inline">Portail</span>
          <span className="text-stone-300 hidden sm:inline">/</span>
          <span className="font-semibold text-stone-800 truncate">
            {tabLabels[activeTab]}
          </span>
        </div>
      </div>

      {/* Right side: Actions, OPCO, Notifications, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Subtle OPCO pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100/80 text-[11px] text-stone-600 border border-stone-200/60">
          <span className="text-stone-400">Prise en charge OPCO :</span>
          <span className="font-semibold text-stone-800">
            {opcoStats.totalPrisEnChargeOPCO.toLocaleString('fr-FR')} €
          </span>
        </div>

        {/* Bouton Sauvegarder en 1 clic (télécharge la base complète pour SharePoint) */}
        {onDirectSave && (
          <button
            id="btn-header-save-excel"
            onClick={handleSaveClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer ${
              justSaved 
                ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
                : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-700/20 active:scale-[0.99]'
            }`}
            title="Télécharger la base complète Excel en 1 clic pour sauvegarde sur SharePoint"
          >
            {justSaved ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Base Téléchargée !</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 text-emerald-200" />
                <span>Sauvegarder</span>
              </>
            )}
          </button>
        )}

        {/* Notifications Icon with Indicator */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 relative transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-stone-200 py-3 z-50 animate-in fade-in duration-150">
              <div className="px-4 pb-2 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-stone-900">Alertes & Relances RH</h3>
                  <p className="text-[11px] text-stone-400">
                    {totalAlerts === 0 ? 'Aucune relance urgente' : `${totalAlerts} point(s) d'attention`}
                  </p>
                </div>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-stone-400 hover:text-stone-600 p-1 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {totalAlerts === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-400">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                    Tout est à jour pour vos sessions et recyclages.
                  </div>
                ) : (
                  <>
                    {recyclingAlerts.map((a, i) => (
                      <div key={`rec-${i}`} className="p-2 rounded-lg bg-amber-50/70 border border-amber-100 flex items-start gap-2.5 text-xs">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-stone-800">{a.collaborateur.prenom} {a.collaborateur.nom}</p>
                          <p className="text-[11px] text-amber-800">{a.intituleRecyclage || a.sessionLibelle}</p>
                          <p className="text-[10px] text-stone-500 mt-0.5">Échéance : {a.dateEcheance}</p>
                        </div>
                      </div>
                    ))}

                    {coldAlerts.map((s) => (
                      <div key={s.sessionId} className="p-2 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs">
                        <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-800 truncate">{s.sessionLibelle}</p>
                          <p className="text-[11px] text-blue-700">Évaluation à froid (+3 mois) en attente</p>
                        </div>
                      </div>
                    ))}

                    {logisticsAlerts.map((s) => (
                      <div key={`log-${s.sessionId}`} className="p-2 rounded-lg bg-stone-50 border border-stone-200/70 flex items-start gap-2.5 text-xs">
                        <ClipboardCheck className="h-4 w-4 text-stone-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-800 truncate">{s.sessionLibelle}</p>
                          <p className="text-[11px] text-stone-600">Salle ou convocations à vérifier</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User / HR Avatar Badge */}
        <div
          className="flex items-center gap-2 py-1 pl-2.5 pr-1.5 rounded-full border border-stone-200/90 bg-stone-50/60"
        >
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-stone-800 leading-tight">
              Service Formation
            </span>
            <span className="text-[10px] text-stone-400 font-medium">
              Espace RH
            </span>
          </div>

          <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};
