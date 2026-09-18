import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Upload, 
  Download, 
  CheckCircle2, 
  Share2, 
  FileSpreadsheet, 
  X, 
  ChevronRight,
  Info,
  Clock
} from 'lucide-react';

interface SharePointSyncBannersProps {
  hasImportedThisSession: boolean;
  hasExportedThisSession: boolean;
  lastImportTime: string | null;
  lastExportTime: string | null;
  onOpenImportModal: () => void;
  onDirectExport: () => void;
  showSaveReminderModal: boolean;
  onCloseSaveReminderModal: () => void;
}

export const SharePointSyncBanners: React.FC<SharePointSyncBannersProps> = ({
  hasImportedThisSession,
  hasExportedThisSession,
  lastImportTime,
  lastExportTime,
  onOpenImportModal,
  onDirectExport,
  showSaveReminderModal,
  onCloseSaveReminderModal
}) => {
  const [isDismissedWarning, setIsDismissedWarning] = useState(false);

  return (
    <>
      {/* 1. Bandeau supérieur d'information & contrôle d'import initial */}
      {!hasImportedThisSession ? (
        <div 
          id="banner-import-warning"
          className="bg-amber-500 text-stone-950 px-4 py-2.5 shadow-sm border-b border-amber-600 flex items-center justify-between gap-3 text-xs z-20 relative"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="p-1 bg-amber-600 text-white rounded-md shrink-0 shadow-2xs">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-stone-950 flex items-center gap-2">
                <span>Vérification Ouverture de Session :</span>
                <span className="font-normal text-stone-900 hidden md:inline">
                  Pensez à charger votre fichier Excel depuis SharePoint pour travailler sur les données à jour.
                </span>
              </p>
              <p className="text-[11px] text-amber-950/80 truncate md:hidden">
                Chargez votre base Excel depuis SharePoint pour avoir les données à jour.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors shadow-2xs text-xs cursor-pointer"
              title="Ouvrir la fenêtre d'import / export Excel"
            >
              <Upload className="h-3.5 w-3.5 text-amber-300" />
              <span>Charger Excel</span>
            </button>
          </div>
        </div>
      ) : (
        /* Bandeau de confirmation de session active et synchronisée */
        <div 
          id="banner-import-confirmed"
          className="bg-emerald-700 text-white px-4 py-1.5 text-xs flex items-center justify-between gap-3 shadow-2xs border-b border-emerald-800 z-20 relative"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-200 shrink-0" />
            <span className="font-medium text-emerald-50 truncate">
              <strong>Base Excel chargée avec succès</strong> {lastImportTime ? `à ${lastImportTime}` : 'pour cette session'} • Vos modifications sont enregistrées localement.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-[11px] text-emerald-200">
              {hasExportedThisSession ? '✓ Sauvegarde SharePoint effectuée' : 'Sauvegarde en attente en fin de session'}
            </span>
            <button
              onClick={onDirectExport}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-900 text-emerald-100 font-semibold text-[11px] transition-colors border border-emerald-600/60 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>Sauvegarder</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Modale / Grand Message de fin de session pour le dépôt SharePoint */}
      {showSaveReminderModal && (
        <div 
          id="modal-sharepoint-save-reminder"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95">
            {/* Header with Icon */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Étape Finale Importante
                  </span>
                  <button
                    onClick={onCloseSaveReminderModal}
                    className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-stone-900 mt-1">
                  Sauvegarde & Dépôt sur SharePoint
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Assurez la pérennité de votre travail et le partage avec l'équipe RH
                </p>
              </div>
            </div>

            {/* Instruction Card */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    Téléchargez la base de données mise à jour (.xlsx)
                  </p>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Le fichier contient l'intégralité des onglets (Sessions, Collaborateurs, Souhaits, Logistique, Évaluations).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-emerald-200/60">
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span>Déposez ce fichier sur le SharePoint RH</span>
                    <Share2 className="h-3.5 w-3.5 text-blue-600" />
                  </p>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Remplacez le classeur de référence sur votre SharePoint d'entreprise pour que vos collègues et votre future session disposent des dernières modifications.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-stone-500 italic">
                {hasExportedThisSession
                  ? '✓ Fichier déjà exporté lors de cette session.'
                  : 'Fichier non encore exporté aujourd\'hui.'}
              </p>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={onCloseSaveReminderModal}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                >
                  Continuer à naviguer
                </button>
                <button
                  onClick={() => {
                    onDirectExport();
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-sm shadow-emerald-700/20 transition-all active:scale-[0.99] cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger la Base Complète (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
