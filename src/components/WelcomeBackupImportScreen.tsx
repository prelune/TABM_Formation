import React, { useState, useRef, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Download, 
  Layers, 
  Sparkles,
  Database,
  Info
} from 'lucide-react';
import { FormationSession, Collaborateur, SouhaitFormation } from '../types';
import { 
  importMasterDatabaseFromExcel, 
  exportMasterDatabaseToExcel 
} from '../utils/excelHelper';

interface WelcomeBackupImportScreenProps {
  onImportComplete: (data: {
    sessions: FormationSession[];
    collaborateurs: Collaborateur[];
    souhaits: SouhaitFormation[];
    summary: string[];
  }) => void;
  onContinueBlank: () => void;
}

export const WelcomeBackupImportScreen: React.FC<WelcomeBackupImportScreenProps> = ({
  onImportComplete,
  onContinueBlank
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    sessionsCount: number;
    collaborateursCount: number;
    souhaitsCount: number;
    summary: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  const processFile = async (file: File) => {
    if (!file) return;

    // Validate extension
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setError('Format de fichier non reconnu. Veuillez sélectionner un fichier Excel (.xlsx ou .xls).');
      return;
    }

    setError(null);
    setIsLoading(true);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));

    try {
      // Import master database with replaceMode = true to ensure fresh authoritative state
      const result = await importMasterDatabaseFromExcel(file, [], [], [], true);
      
      setSuccessInfo({
        sessionsCount: result.sessions.length,
        collaborateursCount: result.collaborateurs.length,
        souhaitsCount: result.souhaits.length,
        summary: result.summary
      });

      // Brief pause to display the success validation before smoothly transitioning into the app
      setTimeout(() => {
        onImportComplete(result);
      }, 750);
    } catch (err: any) {
      console.error('Error importing backup on welcome screen:', err);
      setError(
        err?.message || 
        'Impossible de lire le fichier de sauvegarde. Assurez-vous qu\'il s\'agit d\'un classeur Excel valide contenant vos feuilles de données.'
      );
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleDownloadBlankTemplate = () => {
    exportMasterDatabaseToExcel([], [], []);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-100/90 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      {/* Background Decorative subtle shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-200/30 blur-3xl" />
      </div>

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="bg-stone-900 text-white px-6 sm:px-8 py-7 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800/90 border border-stone-700 text-stone-300 text-xs font-medium mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Formation TABM • Espace sécurisé</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Bienvenue sur votre gestionnaire de formation
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Pour débuter votre session de travail et charger vos données à jour, veuillez importer votre fichier de sauvegarde Excel.
            </p>
          </div>
          
          {/* Subtle logo / icon watermark */}
          <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
            <FileSpreadsheet className="w-44 h-44 text-white" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
            id="welcome-backup-file-input"
          />

          {/* Main Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50/70 scale-[1.01] shadow-lg ring-4 ring-emerald-100'
                : isLoading
                ? 'border-stone-300 bg-stone-50 cursor-wait'
                : 'border-stone-300 hover:border-emerald-600 hover:bg-stone-50/80 shadow-2xs hover:shadow-md'
            }`}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="p-4 bg-emerald-100 text-emerald-700 rounded-full animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-stone-900 text-base">
                    Chargement de votre sauvegarde...
                  </p>
                  {fileName && (
                    <p className="text-xs text-stone-500 mt-1">
                      {fileName} {fileSize ? `(${fileSize})` : ''}
                    </p>
                  )}
                  <p className="text-xs text-emerald-700 font-medium mt-2">
                    Synchronisation des feuilles Sessions, Salariés & Souhaits...
                  </p>
                </div>
              </div>
            ) : successInfo ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full shadow-xs">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-lg">
                    Sauvegarde importée avec succès !
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    {successInfo.collaborateursCount} collaborateurs • {successInfo.sessionsCount} sessions • {successInfo.souhaitsCount} souhaits
                  </p>
                  <p className="text-xs text-emerald-700 font-semibold mt-2 flex items-center justify-center gap-1">
                    <span>Ouverture de votre espace de travail</span>
                    <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 shadow-2xs group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <p className="text-base sm:text-lg font-bold text-stone-900">
                    Glissez-déposez votre sauvegarde Excel ici
                  </p>
                  <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
                    Classeur multi-feuilles issu de SharePoint ou de votre ordinateur
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Sélectionner le fichier Excel (.xlsx)</span>
                </button>

                <p className="text-[11px] text-stone-400">
                  Prise en charge des fichiers .xlsx et .xls
                </p>
              </>
            )}
          </div>

          {/* Error Message banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-rose-900">Échec du chargement</p>
                <p className="text-rose-700 text-xs mt-0.5">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    fileInputRef.current?.click();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 font-semibold text-xs text-rose-800 hover:text-rose-950 underline cursor-pointer"
                >
                  Choisir un autre fichier
                </button>
              </div>
            </div>
          )}

          {/* Reassurance points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-stone-800">100% Hors-ligne & Confidentiel :</span>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  Aucune donnée n’est envoyée vers des serveurs tiers. Tout est traité localement sur votre poste.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-600">
              <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-stone-800">Restauration complète :</span>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  Recharge automatiquement les sessions, les collaborateurs, les souhaits et le suivi OPCO.
                </p>
              </div>
            </div>
          </div>

          {/* Footer action: Continue blank or download template */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
            <button
              type="button"
              onClick={handleDownloadBlankTemplate}
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 font-medium hover:underline cursor-pointer"
              title="Télécharger un modèle Excel complet avec toutes les colonnes et en-têtes nécessaires"
            >
              <Download className="w-3.5 h-3.5 text-stone-400" />
              <span>Télécharger le classeur modèle vierge</span>
            </button>

            <button
              type="button"
              onClick={onContinueBlank}
              className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-950 font-semibold hover:underline cursor-pointer"
            >
              <span>Continuer avec une base vierge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
