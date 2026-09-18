import React, { useState, useRef } from 'react';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  PlusCircle, 
  Search, 
  User, 
  ChevronRight, 
  Filter,
  Download,
  Upload,
  Link2,
  Check,
  X
} from 'lucide-react';
import { FormationSession, Collaborateur, FormationType } from '../types';
import { calculateRecyclingAlerts, RecyclingAlertItem } from '../utils/analytics';
import { exportRecyclageToExcel, importRecyclageFromExcel } from '../utils/excelHelper';

interface RecyclageViewProps {
  sessions: FormationSession[];
  collaborateurs: Collaborateur[];
  onPlanRecyclingSession: (alert: RecyclingAlertItem) => void;
  onSelectSession: (session: FormationSession) => void;
  onUpdateSessions?: (sessions: FormationSession[]) => void;
}

export const RecyclageView: React.FC<RecyclageViewProps> = ({
  sessions,
  collaborateurs,
  onPlanRecyclingSession,
  onSelectSession,
  onUpdateSessions
}) => {
  const [filterState, setFilterState] = useState<'ALL' | 'EXPIRE' | 'URGENT' | 'A_VENIR' | 'VALIDE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [linkingAlertKey, setLinkingAlertKey] = useState<string | null>(null);
  const [selectedTargetSessionId, setSelectedTargetSessionId] = useState<string>('');

  const upcomingSessions = sessions.filter((s) => s.statut === 'A_VENIR' || s.statut === 'EN_COURS');

  const handleAttachToSession = (item: RecyclingAlertItem, sessionId: string) => {
    if (!onUpdateSessions || !sessionId) return;
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession) return;

    const alreadyEnrolled = targetSession.participants.some((p) => p.collaborateurId === item.collaborateurId);
    if (alreadyEnrolled) {
      setImportFeedback(`${item.collaborateur.prenom} ${item.collaborateur.nom} est déjà inscrit(e) à la session « ${targetSession.libelle} » (${targetSession.dateDebut}).`);
      setLinkingAlertKey(null);
      setTimeout(() => setImportFeedback(null), 5000);
      return;
    }

    const updatedSession: FormationSession = {
      ...targetSession,
      participants: [
        ...targetSession.participants,
        {
          collaborateurId: item.collaborateurId,
          status: 'EN_ATTENTE'
        }
      ]
    };

    const updatedAll = sessions.map((s) => (s.id === sessionId ? updatedSession : s));
    onUpdateSessions(updatedAll);
    setImportFeedback(`✓ ${item.collaborateur.prenom} ${item.collaborateur.nom} a été rattaché(e) avec succès à la session « ${targetSession.libelle} » (${targetSession.dateDebut}).`);
    setTimeout(() => setImportFeedback(null), 6000);
    setLinkingAlertKey(null);
    setSelectedTargetSessionId('');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateSessions) return;
    setIsImporting(true);
    setImportFeedback(null);
    try {
      const res = await importRecyclageFromExcel(file, sessions);
      onUpdateSessions(res.updatedSessions);
      setImportFeedback(`Recyclages synchronisés avec succès : ${res.updatedCount} session(s) mise(s) à jour.`);
      setTimeout(() => setImportFeedback(null), 5000);
    } catch (err: any) {
      setImportFeedback('Erreur lors de l\'import des recyclages : ' + (err?.message || 'fichier invalide'));
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const allAlerts = calculateRecyclingAlerts(sessions, collaborateurs);

  const expiresCount = allAlerts.filter((a) => a.etat === 'EXPIRE').length;
  const urgentsCount = allAlerts.filter((a) => a.etat === 'URGENT').length;
  const aVenirCount = allAlerts.filter((a) => a.etat === 'A_VENIR').length;
  const validesCount = allAlerts.filter((a) => a.etat === 'VALIDE').length;

  const filteredAlerts = allAlerts.filter((item) => {
    if (filterState !== 'ALL' && item.etat !== filterState) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCollab =
        item.collaborateur.nom.toLowerCase().includes(q) ||
        item.collaborateur.prenom.toLowerCase().includes(q) ||
        item.collaborateur.matricule.toLowerCase().includes(q) ||
        item.collaborateur.departement.toLowerCase().includes(q);
      const matchLibelle = item.intituleRecyclage.toLowerCase().includes(q);
      return matchCollab || matchLibelle;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Editorial Open-Air Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Recyclages & Habilitations
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            SST, CACES, Incendie, Habilitations • Anticipation et suivi automatique des échéances réglementaires
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportRecyclageToExcel(sessions, collaborateurs)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Exporter les dates de validité au format Excel"
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
                title="Réimporter les périodicités et dates modifiées"
              >
                <Upload className="h-3.5 w-3.5 text-stone-500" />
                <span>{isImporting ? 'Import...' : 'Réimporter'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {importFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{importFeedback}</span>
        </div>
      )}

      {/* Status Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <button
          onClick={() => setFilterState(filterState === 'EXPIRE' ? 'ALL' : 'EXPIRE')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterState === 'EXPIRE'
              ? 'bg-red-50/80 border-red-200 ring-2 ring-red-500/10 shadow-2xs'
              : 'bg-white border-stone-200/80 hover:bg-stone-50 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Échus</span>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-red-600 mt-2">{expiresCount}</p>
          <span className="text-[11px] text-stone-400 mt-1 block">Recyclage impératif</span>
        </button>

        <button
          onClick={() => setFilterState(filterState === 'URGENT' ? 'ALL' : 'URGENT')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterState === 'URGENT'
              ? 'bg-amber-50/80 border-amber-200 ring-2 ring-amber-500/10 shadow-2xs'
              : 'bg-white border-stone-200/80 hover:bg-stone-50 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Urgents (&lt; 60 j)</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-amber-600 mt-2">{urgentsCount}</p>
          <span className="text-[11px] text-stone-400 mt-1 block">À planifier rapidement</span>
        </button>

        <button
          onClick={() => setFilterState(filterState === 'A_VENIR' ? 'ALL' : 'A_VENIR')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterState === 'A_VENIR'
              ? 'bg-blue-50/80 border-blue-200 ring-2 ring-blue-500/10 shadow-2xs'
              : 'bg-white border-stone-200/80 hover:bg-stone-50 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">À venir (&lt; 6 mois)</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-blue-600 mt-2">{aVenirCount}</p>
          <span className="text-[11px] text-stone-400 mt-1 block">À anticiper</span>
        </button>

        <button
          onClick={() => setFilterState(filterState === 'VALIDE' ? 'ALL' : 'VALIDE')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterState === 'VALIDE'
              ? 'bg-emerald-50/80 border-emerald-200 ring-2 ring-emerald-500/10 shadow-2xs'
              : 'bg-white border-stone-200/80 hover:bg-stone-50 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">À jour / Valides</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-emerald-600 mt-2">{validesCount}</p>
          <span className="text-[11px] text-stone-400 mt-1 block">Habilitations en cours</span>
        </button>
      </div>

      {/* Search & Reset filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher collaborateur, titre de recyclage..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          />
        </div>

        {filterState !== 'ALL' && (
          <button
            onClick={() => setFilterState('ALL')}
            className="text-xs text-stone-600 hover:text-stone-900 font-medium self-end underline underline-offset-4 cursor-pointer"
          >
            Afficher toutes les échéances ({allAlerts.length})
          </button>
        )}
      </div>

      {/* List of Recycling Deadlines */}
      <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden shadow-2xs divide-y divide-stone-100">
        {filteredAlerts.map((item, index) => {
          const isExpired = item.etat === 'EXPIRE';
          const isUrgent = item.etat === 'URGENT';
          const itemKey = `${item.sessionId}-${item.collaborateurId}-${index}`;
          const isLinkingThis = linkingAlertKey === itemKey;

          // Check if collaborator is already enrolled in an upcoming session
          const upcomingEnrollment = sessions.find(
            (s) => (s.statut === 'A_VENIR' || s.statut === 'EN_COURS') &&
                   s.participants.some((p) => p.collaborateurId === item.collaborateurId)
          );

          return (
            <div
              key={itemKey}
              className="p-4 space-y-3 hover:bg-stone-50/70 transition-colors text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Collaborator & Qualification */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-stone-900 text-sm">
                      {item.collaborateur.prenom} {item.collaborateur.nom}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                      {item.collaborateur.matricule}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      • {item.collaborateur.departement} ({item.collaborateur.poste})
                    </span>
                    {upcomingEnrollment && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">
                        <Calendar className="h-3 w-3" />
                        Inscrit : {upcomingEnrollment.libelle} ({upcomingEnrollment.dateDebut})
                      </span>
                    )}
                  </div>

                  <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                    <span>{item.intituleRecyclage}</span>
                    <span className="text-[11px] font-normal text-stone-500">
                      (Validité : {item.periodiciteMois} mois)
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-500 flex items-center gap-3 flex-wrap">
                    <span>Dernière session : {item.dateDerniereFormation} ({item.organisme})</span>
                    <span>•</span>
                    <span>Date d'échéance : <strong>{item.dateEcheance}</strong></span>
                  </div>
                </div>

                {/* Right: Expiration Badge and Action Group */}
                <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                  <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    isExpired ? 'bg-red-50 text-red-700 border border-red-200/70' :
                    isUrgent ? 'bg-amber-50 text-amber-700 border border-amber-200/70' :
                    item.etat === 'A_VENIR' ? 'bg-blue-50 text-blue-700 border border-blue-200/70' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  }`}>
                    {isExpired ? `Expiré depuis ${Math.abs(item.joursRestants)}j` :
                     isUrgent ? `Expire dans ${item.joursRestants} jours` :
                     item.etat === 'A_VENIR' ? `Échéance dans ${item.joursRestants}j` :
                     `Valide (${item.joursRestants}j)`}
                  </span>

                  {/* Button 1: Planifier une nouvelle session */}
                  <button
                    onClick={() => onPlanRecyclingSession(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Créer une nouvelle session de formation dédiée"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Planifier session</span>
                  </button>

                  {/* Button 2: Rattacher à une session existante */}
                  {onUpdateSessions && (
                    <button
                      onClick={() => {
                        if (isLinkingThis) {
                          setLinkingAlertKey(null);
                        } else {
                          setLinkingAlertKey(itemKey);
                          setSelectedTargetSessionId(upcomingSessions[0]?.id || '');
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        isLinkingThis
                          ? 'bg-stone-200 text-stone-800 border-stone-300'
                          : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200/90 shadow-2xs'
                      }`}
                      title="Rattacher le salarié à une session de formation planifiée"
                    >
                      <Link2 className="h-3.5 w-3.5 text-stone-500" />
                      <span>Rattacher à une session</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Session Attachment Form */}
              {isLinkingThis && (
                <div className="pt-3 mt-1 border-t border-stone-200/80 bg-stone-50/80 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-medium text-stone-700">
                      Sélectionner la session de formation à venir pour rattacher {item.collaborateur.prenom} {item.collaborateur.nom} :
                    </label>
                    <button
                      onClick={() => setLinkingAlertKey(null)}
                      className="text-stone-400 hover:text-stone-600 self-end sm:self-auto p-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {upcomingSessions.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <select
                        value={selectedTargetSessionId}
                        onChange={(e) => setSelectedTargetSessionId(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-800 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
                      >
                        {upcomingSessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.libelle} — {s.dateDebut} au {s.dateFin} ({s.organisme}) • {s.participants.length} participant(s)
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAttachToSession(item, selectedTargetSessionId || upcomingSessions[0]?.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Confirmer le rattachement</span>
                        </button>

                        <button
                          onClick={() => setLinkingAlertKey(null)}
                          className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 bg-white border border-stone-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200/80">
                      Aucune session à venir disponible. Veuillez d'abord créer une session de formation ou cliquer sur « Planifier session ».
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs">
            Aucun recyclage ne correspond à ces critères.
          </div>
        )}
      </div>
    </div>
  );
};
