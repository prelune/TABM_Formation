import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Download, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  ArrowRight, 
  Building2, 
  UserCheck, 
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  Plus
} from 'lucide-react';
import { SouhaitFormation, Collaborateur, FormationSession, SouhaitStatus } from '../types';
import { calculateWishMatching } from '../utils/analytics';
import { downloadSouhaitsTemplate, exportCurrentSouhaitsToExcel, importSouhaitsFromExcel, parseSouhaitsFile } from '../utils/excelHelper';

interface SouhaitsViewProps {
  souhaits: SouhaitFormation[];
  collaborateurs: Collaborateur[];
  sessions: FormationSession[];
  onUpdateSouhait: (updated: SouhaitFormation) => void;
  onAddSouhait: (newSouhait: SouhaitFormation) => void;
  onImportSouhaits: (imported: Omit<SouhaitFormation, 'id'>[]) => void;
  onPlanSessionForWish: (wish: SouhaitFormation) => void;
  onSelectSession: (session: FormationSession) => void;
  onUpdateSouhaitsList?: (souhaits: SouhaitFormation[]) => void;
}

export const SouhaitsView: React.FC<SouhaitsViewProps> = ({
  souhaits,
  collaborateurs,
  sessions,
  onUpdateSouhait,
  onAddSouhait,
  onImportSouhaits,
  onPlanSessionForWish,
  onSelectSession,
  onUpdateSouhaitsList
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SouhaitStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HAUTE' | 'MOYENNE' | 'BASSE'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analytics on matching
  const matchingData = calculateWishMatching(souhaits, sessions, collaborateurs);
  const collabMap = new Map<string, Collaborateur>(collaborateurs.map((c) => [c.id, c]));
  const sessionMap = new Map<string, FormationSession>(sessions.map((s) => [s.id, s]));

  // Handle Excel upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      if (onUpdateSouhaitsList) {
        const res = await importSouhaitsFromExcel(file, souhaits, collaborateurs);
        onUpdateSouhaitsList(res.updatedSouhaits);
        setUploadSuccessMsg(`Import réussi : ${res.updatedCount} souhait(s) mis à jour, ${res.createdCount} nouveau(x) créé(s).`);
      } else {
        const parsed = await parseSouhaitsFile(file, collaborateurs);
        onImportSouhaits(parsed);
        setUploadSuccessMsg(`${parsed.length} souhaits importés avec succès depuis le fichier.`);
      }
      setTimeout(() => setUploadSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Erreur lors de la lecture du fichier Excel/CSV : ' + (err?.message || 'format non reconnu'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Form for manual wish
  const [formCollabId, setFormCollabId] = useState(collaborateurs[0]?.id || '');
  const [formIntitule, setFormIntitule] = useState('');
  const [formDomaine, setFormDomaine] = useState('Général');
  const [formPriorite, setFormPriorite] = useState<'HAUTE' | 'MOYENNE' | 'BASSE'>('HAUTE');
  const [formMotivation, setFormMotivation] = useState('');

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIntitule.trim()) return;

    const newSouhait: SouhaitFormation = {
      id: `souhait-${Date.now()}`,
      collaborateurId: formCollabId,
      intituleSouhait: formIntitule.trim(),
      domaine: formDomaine.trim(),
      priorite: formPriorite,
      dateSouhait: new Date().toISOString().slice(0, 10),
      motivation: formMotivation.trim(),
      source: 'Forms Annuel',
      statut: 'EN_ATTENTE'
    };

    onAddSouhait(newSouhait);
    setShowAddModal(false);
    setFormIntitule('');
    setFormMotivation('');
  };

  // Manual linking to a session
  const [linkingWishId, setLinkingWishId] = useState<string | null>(null);

  const handleLinkSession = (wish: SouhaitFormation, sessionId: string) => {
    const s = sessionMap.get(sessionId);
    const updated: SouhaitFormation = {
      ...wish,
      sessionIdAssociee: sessionId,
      statut: s?.statut === 'TERMINEE' ? 'REALISE' : 'PLANIFIE',
      dateRealisation: s?.statut === 'TERMINEE' ? s.dateFin : undefined
    };
    onUpdateSouhait(updated);
    setLinkingWishId(null);
  };

  // Filtered list
  const filteredDetails = matchingData.souhaitsDetails.filter((item) => {
    const s = item.souhait;
    if (statusFilter !== 'ALL' && s.statut !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && s.priorite !== priorityFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchIntitule = s.intituleSouhait.toLowerCase().includes(q);
      const matchDomaine = s.domaine.toLowerCase().includes(q);
      const collab = item.collaborateur;
      const matchCollab =
        collab &&
        (collab.nom.toLowerCase().includes(q) ||
          collab.prenom.toLowerCase().includes(q) ||
          collab.matricule.toLowerCase().includes(q) ||
          collab.departement.toLowerCase().includes(q));
      return matchIntitule || matchDomaine || matchCollab;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Editorial Open-Air Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Souhaits & Matching
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {matchingData.totalSouhaits} souhaits enregistrés • Rapprochement besoins individuels et sessions
          </p>
        </div>

        {/* Actions cluster */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportCurrentSouhaitsToExcel(souhaits, collaborateurs)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Exporter tous les souhaits dans un fichier Excel"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Importer des souhaits depuis Excel ou Google Forms"
          >
            <Upload className="h-3.5 w-3.5 text-stone-500" />
            <span>{isUploading ? 'Import...' : 'Importer'}</span>
          </button>

          <button
            onClick={downloadSouhaitsTemplate}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            title="Télécharger le modèle vierge Forms"
          >
            <span>Modèle</span>
          </button>

          <button
            id="btn-add-wish"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nouveau souhait</span>
          </button>
        </div>
      </div>

      {uploadSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccessMsg}</span>
        </div>
      )}

      {/* KPI Matching Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <span className="text-xs font-medium text-stone-500">Adéquation globale</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-stone-900">
              {matchingData.tauxCorrespondance}%
            </span>
            <span className="text-xs text-stone-500">
              Pourvus
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            {matchingData.souhaitsRealises + matchingData.souhaitsPlanifies} / {matchingData.totalSouhaits} souhaits
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <span className="text-xs font-medium text-stone-500">Souhaits réalisés</span>
          <p className="text-3xl font-bold tracking-tight text-emerald-600 mt-2">
            {matchingData.souhaitsRealises}
          </p>
          <p className="text-[11px] text-stone-400 mt-2">Formations achevées</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <span className="text-xs font-medium text-stone-500">Souhaits planifiés</span>
          <p className="text-3xl font-bold tracking-tight text-blue-600 mt-2">
            {matchingData.souhaitsPlanifies}
          </p>
          <p className="text-[11px] text-stone-400 mt-2">Sessions programmées</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <span className="text-xs font-medium text-stone-500">Besoins en attente</span>
          <p className="text-3xl font-bold tracking-tight text-amber-600 mt-2">
            {matchingData.souhaitsEnAttente}
          </p>
          <p className="text-[11px] text-stone-400 mt-2">À intégrer au plan</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par collaborateur, souhait, domaine..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-800 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-700 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente (Non comblés)</option>
            <option value="PLANIFIE">Planifiés (À venir)</option>
            <option value="REALISE">Réalisés (Faits)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-700 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          >
            <option value="ALL">Toutes les priorités</option>
            <option value="HAUTE">Priorité Haute</option>
            <option value="MOYENNE">Priorité Moyenne</option>
            <option value="BASSE">Priorité Basse</option>
          </select>
        </div>
      </div>

      {/* Matching Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Tableau Croisé des Souhaits Collaborateurs vs Formations Réalisées ({filteredDetails.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Associez ou créez des sessions en 1 clic
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredDetails.map(({ souhait, collaborateur, sessionAssociee, estComble }) => (
            <div
              key={souhait.id}
              className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors text-xs"
            >
              {/* Col 1: Collaborateur & Wish */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {collaborateur ? `${collaborateur.prenom} ${collaborateur.nom}` : 'Collaborateur'}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    {collaborateur?.matricule}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    • {collaborateur?.departement}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    souhait.priorite === 'HAUTE' ? 'bg-red-100 text-red-700' :
                    souhait.priorite === 'MOYENNE' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {souhait.priorite}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-900">
                  {souhait.intituleSouhait}
                </div>

                {souhait.motivation && (
                  <p className="text-xs text-slate-500 italic max-w-2xl">
                    "{souhait.motivation}"
                  </p>
                )}

                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Domaine : {souhait.domaine}</span>
                  <span>Recueilli via : {souhait.source} ({souhait.dateSouhait})</span>
                </div>
              </div>

              {/* Col 2: Matching Status & Associated Session */}
              <div className="lg:w-80 p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Statut de couverture
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    souhait.statut === 'REALISE' ? 'bg-emerald-100 text-emerald-800' :
                    souhait.statut === 'PLANIFIE' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {souhait.statut === 'REALISE' ? '✓ Réalisé' :
                     souhait.statut === 'PLANIFIE' ? '◷ Session planifiée' :
                     '⚠ En attente de session'}
                  </span>
                </div>

                {sessionAssociee ? (
                  <div className="space-y-1">
                    <p
                      onClick={() => onSelectSession(sessionAssociee)}
                      className="text-xs font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer line-clamp-1"
                    >
                      {sessionAssociee.libelle}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {sessionAssociee.organisme} • {sessionAssociee.dateDebut} ({sessionAssociee.dureeHeures}h)
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Aucune session encore rattachée à ce souhait.
                  </p>
                )}

                {/* Quick actions for this wish */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  {!estComble ? (
                    <>
                      <button
                        onClick={() => onPlanSessionForWish(souhait)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-2xs"
                        title="Créer une nouvelle session pré-remplie avec ce collaborateur et ce titre"
                      >
                        <PlusCircle className="h-3 w-3 text-indigo-400" />
                        <span>Planifier session</span>
                      </button>

                      <button
                        onClick={() => setLinkingWishId(souhait.id)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md"
                      >
                        Lier existante
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setLinkingWishId(souhait.id)}
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      Changer l'association
                    </button>
                  )}
                </div>

                {/* Inline link selector */}
                {linkingWishId === souhait.id && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <label className="block text-[11px] font-medium text-slate-700">
                      Sélectionner la session correspondante :
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleLinkSession(souhait, e.target.value);
                      }}
                      className="w-full text-[11px] px-2 py-1 rounded border border-slate-300 bg-white"
                      defaultValue=""
                    >
                      <option value="" disabled>-- Choisir une session --</option>
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.libelle} ({s.dateDebut}) - {s.statut}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setLinkingWishId(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredDetails.length === 0 && (
            <div className="p-10 text-center text-slate-400 text-xs">
              Aucun souhait ne correspond à ces filtres.
            </div>
          )}
        </div>
      </div>

      {/* Manual Add Wish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Ajouter un souhait de formation
            </h3>

            <form onSubmit={handleManualAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Collaborateur <span className="text-red-500">*</span>
                </label>
                <select
                  value={formCollabId}
                  onChange={(e) => setFormCollabId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {collaborateurs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.prenom} {c.nom} — {c.matricule} ({c.departement})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Intitulé de la formation souhaitée <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formIntitule}
                  onChange={(e) => setFormIntitule(e.target.value)}
                  placeholder="Ex: Certification Scrum Master, Python Data Science..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Domaine</label>
                  <input
                    type="text"
                    value={formDomaine}
                    onChange={(e) => setFormDomaine(e.target.value)}
                    placeholder="Ex: Informatique, Management..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priorité</label>
                  <select
                    value={formPriorite}
                    onChange={(e) => setFormPriorite(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="HAUTE">Haute</option>
                    <option value="MOYENNE">Moyenne</option>
                    <option value="BASSE">Basse</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivation / Objectif</label>
                <textarea
                  rows={2}
                  value={formMotivation}
                  onChange={(e) => setFormMotivation(e.target.value)}
                  placeholder="Projet associé, montée en compétences..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Enregistrer le souhait
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
