import React, { useState, useRef } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  Users, 
  Building2, 
  Euro, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  ChevronRight,
  Trash2,
  Copy,
  Download,
  Upload,
  Layers,
  MapPin,
  Utensils,
  Mail
} from 'lucide-react';
import { FormationSession, Collaborateur, SessionStatus, FormationType } from '../types';
import { exportCurrentSessionsToExcel, importSessionsFromExcel } from '../utils/excelHelper';

interface SessionsViewProps {
  sessions: FormationSession[];
  collaborateurs: Collaborateur[];
  onSelectSession: (session: FormationSession) => void;
  onOpenCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDuplicateSession: (session: FormationSession) => void;
  onUpdateSessions?: (sessions: FormationSession[]) => void;
}

export const SessionsView: React.FC<SessionsViewProps> = ({
  sessions,
  collaborateurs,
  onSelectSession,
  onOpenCreateSession,
  onDeleteSession,
  onDuplicateSession,
  onUpdateSessions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SessionStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | FormationType>('ALL');
  const [recyclageOnly, setRecyclageOnly] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<FormationSession | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const collabMap = new Map<string, Collaborateur>(collaborateurs.map((c) => [c.id, c]));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateSessions) return;
    setIsImporting(true);
    setImportFeedback(null);
    try {
      const res = await importSessionsFromExcel(file, sessions, collaborateurs);
      onUpdateSessions(res.updatedSessions);
      setImportFeedback(`Synchronisation réussie : ${res.updatedCount} session(s) mise(s) à jour, ${res.createdCount} nouvelle(s) créée(s).`);
      setTimeout(() => setImportFeedback(null), 5000);
    } catch (err: any) {
      setImportFeedback('Erreur lors de l\'import Excel : ' + (err?.message || 'format non reconnu'));
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (statusFilter !== 'ALL' && s.statut !== statusFilter) return false;
    if (typeFilter !== 'ALL' && s.type !== typeFilter) return false;
    if (recyclageOnly && !s.recyclage.aRecycler) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchLibelle = s.libelle.toLowerCase().includes(q);
      const matchOrganisme = s.organisme.toLowerCase().includes(q);
      const matchOpco = s.opco.nomOpco.toLowerCase().includes(q);
      const matchParticipant = s.participants.some((p) => {
        const c = collabMap.get(p.collaborateurId);
        return (
          c &&
          (c.nom.toLowerCase().includes(q) ||
            c.prenom.toLowerCase().includes(q) ||
            c.matricule.toLowerCase().includes(q))
        );
      });

      return matchLibelle || matchOrganisme || matchOpco || matchParticipant;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Editorial Open Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Sessions & Planning
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {filteredSessions.length} session(s) • Suivi des inscriptions, logistique et budget OPCO
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportCurrentSessionsToExcel(sessions, collaborateurs)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Télécharger l'état actuel des sessions dans un classeur Excel"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {onUpdateSessions && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg transition-colors shadow-2xs cursor-pointer"
                title="Importer des modifications ou nouvelles sessions depuis Excel"
              >
                <Upload className="h-3.5 w-3.5 text-stone-500" />
                <span>{isImporting ? 'Import...' : 'Réimporter'}</span>
              </button>
            </>
          )}

          <button
            id="btn-add-session-from-view"
            onClick={onOpenCreateSession}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nouvelle session</span>
          </button>
        </div>
      </div>

      {importFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{importFeedback}</span>
        </div>
      )}

      {/* Filter Toolbar (Segmented Pills + Search) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
        {/* Status Segmented Control */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: 'A_VENIR', label: 'À venir' },
            { id: 'EN_COURS', label: 'En cours' },
            { id: 'TERMINEE', label: 'Terminées' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Secondary Filters */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre, organisme..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-800 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-700 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          >
            <option value="ALL">Toutes modalités</option>
            <option value="Présentiel">Présentiel</option>
            <option value="Distanciel">Distanciel</option>
            <option value="Blended / Mixte">Mixte</option>
            <option value="Obligatoire / Sécurité">Sécurité</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-stone-600 whitespace-nowrap cursor-pointer px-2 py-1.5 rounded-lg hover:bg-stone-50">
            <input
              type="checkbox"
              checked={recyclageOnly}
              onChange={(e) => setRecyclageOnly(e.target.checked)}
              className="rounded border-stone-300 text-stone-900"
            />
            <span className="hidden sm:inline">Recyclages</span>
          </label>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.map((session) => {
          const isUpcoming = session.statut === 'A_VENIR';
          const isFinished = session.statut === 'TERMINEE';
          const salleOk = session.logistique.salleReservee;
          const repasOk = session.logistique.plateauxRepasCommandes;
          const convocationOk = session.logistique.convocationEnvoyee;

          return (
            <div
              key={session.id}
              className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-2xs hover:border-stone-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Session Core Info */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isUpcoming ? 'bg-blue-50 text-blue-700 border border-blue-200/60' :
                    isFinished ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                    session.statut === 'EN_COURS' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                    'bg-stone-100 text-stone-600'
                  }`}>
                    {session.statut === 'A_VENIR' ? 'À venir' : session.statut === 'TERMINEE' ? 'Terminée' : session.statut}
                  </span>

                  <span className="text-[11px] text-stone-500 font-medium">
                    {session.type}
                  </span>

                  {session.recyclage.aRecycler && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-medium flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 text-amber-600" />
                      Recyclable ({session.recyclage.periodiciteMois}m)
                    </span>
                  )}

                  {session.opco.declare && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                      OPCO : {session.opco.montantPrisEnCharge} €
                    </span>
                  )}
                </div>

                <h3
                  onClick={() => onSelectSession(session)}
                  className="text-base font-semibold text-stone-900 hover:text-stone-600 transition-colors cursor-pointer"
                >
                  {session.libelle}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-stone-400" />
                    {session.organisme}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-stone-400" />
                    {session.dateDebut} au {session.dateFin}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-stone-400" />
                    {session.dureeJours}j ({session.dureeHeures}h)
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-stone-400" />
                    {session.participants.length} participant(s)
                  </span>
                  <span className="font-medium text-stone-700">
                    {session.coutPedagogiqueTotal.toLocaleString('fr-FR')} € HT
                  </span>
                </div>
              </div>

              {/* Logistics Status & Action Group */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 shrink-0">
                {/* Logistics Badges: Salle, Convoqué, Repas */}
                <div className="flex items-center gap-1.5 text-xs flex-wrap" title="Statut logistique">
                  {/* Badge Salle */}
                  <span 
                    className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      salleOk 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' 
                        : 'bg-stone-100 text-stone-500 border border-stone-200/60'
                    }`}
                    title={salleOk ? `Salle réservée : ${session.logistique.nomSalle || 'OK'}` : 'Salle non réservée'}
                  >
                    <MapPin className="h-3 w-3" />
                    <span>{salleOk ? 'Salle OK' : 'Sans salle'}</span>
                  </span>

                  {/* Badge Convoqué */}
                  <span 
                    className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      convocationOk 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' 
                        : 'bg-stone-100 text-stone-500 border border-stone-200/60'
                    }`}
                    title={convocationOk ? `Convocations envoyées le ${session.logistique.dateConvocation || 'récemment'}` : 'Convocations non envoyées'}
                  >
                    <Mail className="h-3 w-3" />
                    <span>{convocationOk ? 'Convoqué' : 'À convoquer'}</span>
                  </span>

                  {/* Badge Repas */}
                  <span 
                    className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      repasOk 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' 
                        : 'bg-stone-100 text-stone-500 border border-stone-200/60'
                    }`}
                    title={repasOk ? `Plateaux repas commandés${session.logistique.detailsRestauration ? ' : ' + session.logistique.detailsRestauration : ''}` : 'Sans commande de repas'}
                  >
                    <Utensils className="h-3 w-3" />
                    <span>{repasOk ? 'Repas commandé' : 'Sans repas'}</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDuplicateSession(session)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                    title="Dupliquer la session"
                  >
                    <Copy className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setSessionToDelete(session)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Supprimer la session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onSelectSession(session)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Gérer</span>
                    <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="bg-white p-12 rounded-xl border border-stone-200/80 text-center text-stone-400 space-y-2">
            <Calendar className="h-8 w-8 text-stone-300 mx-auto" />
            <p className="text-sm font-medium text-stone-600">Aucune session ne correspond aux critères.</p>
            <p className="text-xs text-stone-400">Modifiez votre recherche ou créez une nouvelle session de formation.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Session Deletion */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  Supprimer cette session ?
                </h3>
                <p className="text-xs text-stone-500">
                  Cette action est définitive et supprimera l'ensemble du suivi associé.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
              <p className="font-semibold text-stone-900">
                {sessionToDelete.libelle}
              </p>
              <p className="text-[11px] text-stone-500">
                Organisme : {sessionToDelete.organisme} • Du {sessionToDelete.dateDebut} au {sessionToDelete.dateFin}
              </p>
              <p className="text-[11px] text-stone-500">
                Participants inscrits : {sessionToDelete.participants.length}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSession(sessionToDelete.id);
                  setSessionToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Supprimer définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
