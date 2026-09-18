import React, { useRef, useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Layers, 
  CalendarCheck2, 
  Users, 
  Sparkles, 
  ClipboardCheck, 
  Star, 
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { FormationSession, Collaborateur, SouhaitFormation } from '../types';
import {
  exportMasterDatabaseToExcel,
  importMasterDatabaseFromExcel,
  exportCurrentSessionsToExcel,
  importSessionsFromExcel,
  exportCurrentCollaborateursToExcel,
  importCollaborateursFromExcel,
  exportCurrentSouhaitsToExcel,
  importSouhaitsFromExcel,
  exportCurrentLogistiqueToExcel,
  importLogistiqueFromExcel,
  exportCurrentEvaluationsToExcel,
  importEvaluationsFromExcel,
  exportCurrentRecyclagesToExcel,
  importRecyclagesFromExcel,
  downloadCollaborateursTemplate,
  downloadSouhaitsTemplate
} from '../utils/excelHelper';

interface ExcelSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: FormationSession[];
  collaborateurs: Collaborateur[];
  souhaits: SouhaitFormation[];
  onUpdateSessions: (sessions: FormationSession[]) => void;
  onUpdateCollaborateurs: (collaborateurs: Collaborateur[]) => void;
  onUpdateSouhaits: (souhaits: SouhaitFormation[]) => void;
  onImportSuccess?: () => void;
  onExportSuccess?: () => void;
  onResetToDefault?: () => void;
}

export const ExcelSyncModal: React.FC<ExcelSyncModalProps> = ({
  isOpen,
  onClose,
  sessions,
  collaborateurs,
  souhaits,
  onUpdateSessions,
  onUpdateCollaborateurs,
  onUpdateSouhaits,
  onImportSuccess,
  onExportSuccess,
  onResetToDefault
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; details?: string[] } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const [replaceMode, setReplaceMode] = useState<boolean>(true);

  const fileInputRefMaster = useRef<HTMLInputElement>(null);
  const fileInputRefSessions = useRef<HTMLInputElement>(null);
  const fileInputRefCollabs = useRef<HTMLInputElement>(null);
  const fileInputRefSouhaits = useRef<HTMLInputElement>(null);
  const fileInputRefLogistique = useRef<HTMLInputElement>(null);
  const fileInputRefEvaluations = useRef<HTMLInputElement>(null);
  const fileInputRefRecyclages = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImportMaster = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingAction('master');
    setFeedback(null);
    try {
      const res = await importMasterDatabaseFromExcel(file, sessions, collaborateurs, souhaits, replaceMode);
      onUpdateSessions(res.sessions);
      onUpdateCollaborateurs(res.collaborateurs);
      onUpdateSouhaits(res.souhaits);
      if (onImportSuccess) onImportSuccess();
      setFeedback({
        type: 'success',
        message: replaceMode 
          ? 'Mémoire intégrale réinitialisée et synchronisée avec le fichier Excel ! Les lignes supprimées du fichier ont bien disparu de l\'application.'
          : 'Synchronisation globale Excel réussie ! La base de données est maintenant chargée et active.',
        details: res.summary
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Erreur lors de la lecture du fichier Excel : ' + (err?.message || 'format non valide')
      });
    } finally {
      setLoadingAction(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleImportSessions = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingAction('sessions');
    setFeedback(null);
    try {
      const res = await importSessionsFromExcel(file, sessions, collaborateurs);
      onUpdateSessions(res.updatedSessions);
      setFeedback({
        type: 'success',
        message: `Sessions synchronisées : ${res.updatedCount} mise(s) à jour, ${res.createdCount} nouvelle(s) session(s) créée(s).`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Erreur d\'import des sessions : ' + (err?.message || 'format de fichier non valide')
      });
    } finally {
      setLoadingAction(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleImportCollabs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingAction('collabs');
    setFeedback(null);
    try {
      const res = await importCollaborateursFromExcel(file, collaborateurs);
      onUpdateCollaborateurs(res.updatedCollaborateurs);
      setFeedback({
        type: 'success',
        message: `Collaborateurs synchronisés : ${res.updatedCount} mis à jour, ${res.createdCount} nouveau(x) créé(s).`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Erreur d\'import collaborateurs : ' + (err?.message || 'format de fichier non valide')
      });
    } finally {
      setLoadingAction(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleImportSouhaits = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingAction('souhaits');
    setFeedback(null);
    try {
      const res = await importSouhaitsFromExcel(file, souhaits, collaborateurs);
      onUpdateSouhaits(res.updatedSouhaits);
      setFeedback({
        type: 'success',
        message: `Souhaits synchronisés : ${res.updatedCount} mis à jour, ${res.createdCount} nouveau(x) créé(s).`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Erreur d\'import souhaits : ' + (err?.message || 'format de fichier non valide')
      });
    } finally {
      setLoadingAction(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleImportLogistique = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingAction('logistique');
    setFeedback(null);
    try {
      const res = await importLogistiqueFromExcel(file, sessions);
      onUpdateSessions(res.updatedSessions);
      setFeedback({
        type: 'success',
        message: `Logistique synchronisée avec succès pour ${res.updatedCount} session(s).`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Erreur d\'import logistique : ' + (err?.message || 'format de fichier non valide')
      });
    } finally {
      setLoadingAction(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleImportEvaluations = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingAction('evaluations');
    setFeedback(null);
    try {
      const res = await importEvaluationsFromExcel(file, sessions);
      onUpdateSessions(res.updatedSessions);
      setFeedback({
        type: 'success',
        message: `Évaluations synchronisées avec succès pour ${res.updatedCount} session(s).`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Erreur d\'import évaluations : ' + (err?.message || 'format de fichier non valide')
      });
    } finally {
      setLoadingAction(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleImportRecyclages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingAction('recyclages');
    setFeedback(null);
    try {
      const res = await importRecyclagesFromExcel(file, sessions);
      onUpdateSessions(res.updatedSessions);
      setFeedback({
        type: 'success',
        message: `Recyclages synchronisés avec succès pour ${res.updatedCount} session(s).`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Erreur d\'import recyclages : ' + (err?.message || 'format de fichier non valide')
      });
    } finally {
      setLoadingAction(null);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-600/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sauvegarder & Synchroniser les Données Excel (SharePoint)
              </h2>
              <p className="text-xs text-slate-500">
                Chargez le classeur de référence depuis votre SharePoint au démarrage, puis téléchargez la base à jour pour la redéposer en fin de session.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SharePoint Workflow Reminder Banner */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/80 text-xs text-blue-900 flex items-start gap-3">
            <Layers className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-blue-950">Procédure de Sauvegarde SharePoint :</p>
              <p className="text-[11px] text-blue-850">
                <strong>1. Début de session :</strong> Cliquez sur <em>« Réimporter Classeur »</em> ci-dessous pour charger votre fichier Excel enregistré sur votre SharePoint.<br/>
                <strong>2. Fin de session :</strong> Cliquez sur <em>« Exporter Base Complète »</em> pour télécharger le fichier à jour et le glisser-déposer sur votre SharePoint RH.
              </p>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{feedback.message}</p>
                {feedback.details && feedback.details.length > 0 && (
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-800">
                    {feedback.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Master Box: All Data in One Workbook */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                  Export & Import Global
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-emerald-700" />
                  <span>Base Complète Multi-Feuilles (Sessions, Collabs, Souhaits, Logistique, Évaluations)</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Générez un classeur unique contenant tous les onglets, ou réimportez votre classeur pour tout synchroniser en 1 clic.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    exportMasterDatabaseToExcel(sessions, collaborateurs, souhaits);
                    if (onExportSuccess) onExportSuccess();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Exporter Base Complète</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRefMaster}
                  onChange={handleImportMaster}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRefMaster.current?.click()}
                  disabled={loadingAction === 'master'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100/50 rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{loadingAction === 'master' ? 'Analyse...' : 'Réimporter Classeur'}</span>
                </button>
              </div>
            </div>

            {/* Mode selection for Import */}
            <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-950">Mode de réimport :</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="replaceModeToggle"
                    checked={replaceMode}
                    onChange={() => setReplaceMode(true)}
                    className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span className="text-stone-800 font-medium">
                    <strong>Remplacement total du cerveau</strong> (Les lignes supprimées d'Excel sont supprimées de l'application)
                  </span>
                </label>
                <span className="text-stone-300">|</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="replaceModeToggle"
                    checked={!replaceMode}
                    onChange={() => setReplaceMode(false)}
                    className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span className="text-stone-600">
                    Mise à jour incrémentale (Conserve les anciennes données)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
            <HelpCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-800">Comment fonctionne la mise à jour par Excel ?</span>
              <p>
                <strong>Pour modifier des lignes existantes :</strong> conservez l'ID de la ligne intact. Toute modification apportée aux autres colonnes mettra à jour l'enregistrement dans l'application.
              </p>
              <p>
                <strong>Pour ajouter de nouvelles lignes en masse :</strong> ajoutez simplement de nouvelles lignes en laissant la colonne ID vide (ou avec un nouvel identifiant). L'outil créera automatiquement les nouveaux éléments lors du réimport.
              </p>
            </div>
          </div>

          {/* Granular Modules Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Exports & Réimports par Fonctionnalité Métier
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Sessions */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarCheck2 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Sessions & Catalogue</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{sessions.length} sessions</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dates, coûts, organismes, horaires, OPCO et matricules des participants.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => exportCurrentSessionsToExcel(sessions, collaborateurs)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Exporter</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRefSessions}
                    onChange={handleImportSessions}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRefSessions.current?.click()}
                    disabled={loadingAction === 'sessions'}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    <span>{loadingAction === 'sessions' ? 'Import...' : 'Réimporter'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Collaborateurs */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">Référentiel Collaborateurs</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{collaborateurs.length} salariés</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Matricules, genres F/H, services, fonctions, dates d'entrée et emails.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => exportCurrentCollaborateursToExcel(collaborateurs)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Exporter</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRefCollabs}
                    onChange={handleImportCollabs}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRefCollabs.current?.click()}
                    disabled={loadingAction === 'collabs'}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{loadingAction === 'collabs' ? 'Import...' : 'Réimporter'}</span>
                  </button>
                </div>
              </div>

              {/* 3. Souhaits */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Souhaits & Recueil Forms</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{souhaits.length} souhaits</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Besoins de formation, domaines, priorités, statuts (en attente, planifié, réalisé).
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => exportCurrentSouhaitsToExcel(souhaits, collaborateurs)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Exporter</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRefSouhaits}
                    onChange={handleImportSouhaits}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRefSouhaits.current?.click()}
                    disabled={loadingAction === 'souhaits'}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    <span>{loadingAction === 'souhaits' ? 'Import...' : 'Réimporter'}</span>
                  </button>
                </div>
              </div>

              {/* 4. Logistique */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Logistique & Émargement</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Suivi matériel</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Réservation des salles, commandes de repas, convocations et consignes.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => exportCurrentLogistiqueToExcel(sessions)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Exporter</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRefLogistique}
                    onChange={handleImportLogistique}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRefLogistique.current?.click()}
                    disabled={loadingAction === 'logistique'}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{loadingAction === 'logistique' ? 'Import...' : 'Réimporter'}</span>
                  </button>
                </div>
              </div>

              {/* 5. Evaluations */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-900">Évaluations à Chaud & à Froid</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Qualité & ROI</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Notes de satisfaction, recommandations, bilans opérationnels à 3 mois.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => exportCurrentEvaluationsToExcel(sessions)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Exporter</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRefEvaluations}
                    onChange={handleImportEvaluations}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRefEvaluations.current?.click()}
                    disabled={loadingAction === 'evaluations'}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 text-amber-700" />
                    <span>{loadingAction === 'evaluations' ? 'Import...' : 'Réimporter'}</span>
                  </button>
                </div>
              </div>

              {/* 6. Recyclages */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-rose-600" />
                    <span className="text-xs font-bold text-slate-900">Recyclages & Habilitations</span>
                  </div>
                  <span className="text-[11px] text-slate-400">SST, CACES...</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Paramétrage des périodicités (24 mois, 36 mois) et dates de recyclage.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => exportCurrentRecyclagesToExcel(sessions)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Exporter</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRefRecyclages}
                    onChange={handleImportRecyclages}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRefRecyclages.current?.click()}
                    disabled={loadingAction === 'recyclages'}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 text-rose-700" />
                    <span>{loadingAction === 'recyclages' ? 'Import...' : 'Réimporter'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Model Templates Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
            <span>Besoin de fichiers vierges de démarrage ?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadCollaborateursTemplate}
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                <span>Modèle Collaborateurs vierge</span>
              </button>
              <span>•</span>
              <button
                onClick={downloadSouhaitsTemplate}
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                <span>Modèle Souhaits vierge</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
