import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Building2, 
  Euro, 
  Users, 
  MapPin, 
  Utensils, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  Sparkles, 
  Send, 
  Check, 
  Layers, 
  RefreshCw,
  Edit3,
  Search,
  Plus,
  Trash2,
  UserPlus
} from 'lucide-react';
import { 
  FormationSession, 
  Collaborateur, 
  PresenceStatus, 
  EvaluationChaud, 
  EvaluationFroid, 
  SuiviOPCO, 
  LogistiqueSession 
} from '../types';

interface SessionDetailModalProps {
  session: FormationSession;
  collaborateurs: Collaborateur[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updated: FormationSession) => void;
  onUpdateSession?: (updated: FormationSession) => void;
  onEditFullSession?: (session: FormationSession) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  collaborateurs,
  isOpen,
  onClose,
  onUpdate,
  onUpdateSession,
  onEditFullSession,
  onDeleteSession
}) => {
  if (!isOpen) return null;

  const handleUpdateCallback = onUpdate || onUpdateSession || (() => {});

  const [activeTab, setActiveTab] = useState<'synthese' | 'logistique' | 'opco' | 'chaud' | 'froid'>('synthese');
  const collabMap = new Map<string, Collaborateur>(collaborateurs.map((c) => [c.id, c]));

  // Local state for interactive editing
  const [logistique, setLogistique] = useState<LogistiqueSession>({ ...session.logistique });
  const [participants, setParticipants] = useState(session.participants);
  const [opco, setOpco] = useState<SuiviOPCO>({ ...session.opco });
  const [evalChaud, setEvalChaud] = useState<EvaluationChaud>({ ...session.evaluationChaud });
  const [evalFroid, setEvalFroid] = useState<EvaluationFroid>({ ...session.evaluationFroid });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Collaborator search & addition state
  const [showAddCollab, setShowAddCollab] = useState(false);
  const [collabSearch, setCollabSearch] = useState('');
  const [collabDeptFilter, setCollabDeptFilter] = useState('ALL');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setLogistique({ ...session.logistique });
    setParticipants(session.participants);
    setOpco({ ...session.opco });
    setEvalChaud({ ...session.evaluationChaud });
    setEvalFroid({ ...session.evaluationFroid });
    setHasUnsavedChanges(false);
    setShowAddCollab(false);
  }, [session.id]);

  const enrolledCollabIds = new Set(participants.map((p) => p.collaborateurId));
  const availableCollaborateurs = collaborateurs.filter((c) => !enrolledCollabIds.has(c.id));
  const departments = Array.from(new Set(collaborateurs.map((c) => c.departement))).sort();

  const filteredAvailable = availableCollaborateurs
    .filter((collab) => {
      const matchesSearch =
        collab.nom.toLowerCase().includes(collabSearch.toLowerCase()) ||
        collab.prenom.toLowerCase().includes(collabSearch.toLowerCase()) ||
        collab.matricule.toLowerCase().includes(collabSearch.toLowerCase()) ||
        collab.poste.toLowerCase().includes(collabSearch.toLowerCase());
      const matchesDept = collabDeptFilter === 'ALL' || collab.departement === collabDeptFilter;
      return matchesSearch && matchesDept;
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }) || a.prenom.localeCompare(b.prenom, 'fr'));

  const handleAddParticipant = (collabId: string) => {
    if (participants.some((p) => p.collaborateurId === collabId)) return;
    setParticipants((prev) => [
      ...prev,
      {
        collaborateurId: collabId,
        status: 'EN_ATTENTE'
      }
    ]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveParticipant = (collabId: string) => {
    setParticipants((prev) => prev.filter((p) => p.collaborateurId !== collabId));
    setHasUnsavedChanges(true);
  };

  // Logistics handlers
  const handleToggleRoom = (val: boolean) => {
    setLogistique((prev) => ({ ...prev, salleReservee: val }));
    setHasUnsavedChanges(true);
  };

  const handleRoomName = (name: string) => {
    setLogistique((prev) => ({ ...prev, nomSalle: name }));
    setHasUnsavedChanges(true);
  };

  const handleToggleMeals = (val: boolean) => {
    setLogistique((prev) => ({ ...prev, plateauxRepasCommandes: val }));
    setHasUnsavedChanges(true);
  };

  const handleMealDetails = (txt: string) => {
    setLogistique((prev) => ({ ...prev, detailsRestauration: txt }));
    setHasUnsavedChanges(true);
  };

  const handleToggleConvocation = (val: boolean) => {
    setLogistique((prev) => ({
      ...prev,
      convocationEnvoyee: val,
      dateConvocation: val ? (prev.dateConvocation || new Date().toISOString().slice(0, 10)) : undefined
    }));
    setHasUnsavedChanges(true);
  };

  // Attendance handlers
  const handlePresenceChange = (collabId: string, status: PresenceStatus) => {
    setParticipants((prev) =>
      prev.map((p) => (p.collaborateurId === collabId ? { ...p, status } : p))
    );
    setHasUnsavedChanges(true);
  };

  // OPCO handlers
  const handleOpcoField = (field: keyof SuiviOPCO, value: any) => {
    setOpco((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Hot Evaluation handlers: noteGlobale is automatically calculated as the average of the 3 complementary notes (Contenu, Pédagogie, Organisation)
  const handleEvalChaudSubNote = (
    field: 'noteContenu' | 'noteFormateur' | 'noteOrganisation',
    val: number
  ) => {
    setEvalChaud((prev) => {
      const clampedVal = Math.max(0, Math.min(5, val));
      const updated = {
        ...prev,
        [field]: clampedVal,
        effectuee: true,
        dateSaisie: new Date().toISOString().slice(0, 10)
      };

      const notes: number[] = [];
      if (updated.noteContenu && updated.noteContenu > 0) notes.push(updated.noteContenu);
      if (updated.noteFormateur && updated.noteFormateur > 0) notes.push(updated.noteFormateur);
      if (updated.noteOrganisation && updated.noteOrganisation > 0) notes.push(updated.noteOrganisation);

      const computedAverage = notes.length > 0
        ? Math.round((notes.reduce((acc, curr) => acc + curr, 0) / notes.length) * 10) / 10
        : 0;

      return {
        ...updated,
        noteGlobale: computedAverage
      };
    });
    setHasUnsavedChanges(true);
  };

  // Cold Evaluation handlers
  const handleTriggerColdReminder = () => {
    setEvalFroid((prev) => ({
      ...prev,
      rappelEnvoye: true,
      dateRappel: new Date().toISOString().slice(0, 10)
    }));
    setHasUnsavedChanges(true);
  };

  const handleColdEvalSubmit = (feedback: Partial<EvaluationFroid>) => {
    setEvalFroid((prev) => ({
      ...prev,
      ...feedback,
      effectuee: true,
      dateRealisation: new Date().toISOString().slice(0, 10)
    }));
    setHasUnsavedChanges(true);
  };

  // Save all changes
  const handleSaveChanges = () => {
    const updated: FormationSession = {
      ...session,
      logistique,
      participants,
      opco,
      evaluationChaud: evalChaud,
      evaluationFroid: evalFroid
    };
    handleUpdateCallback(updated);
    setHasUnsavedChanges(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                session.statut === 'A_VENIR' ? 'bg-blue-100 text-blue-700' :
                session.statut === 'EN_COURS' ? 'bg-amber-100 text-amber-800' :
                session.statut === 'TERMINEE' ? 'bg-emerald-100 text-emerald-800' :
                'bg-red-100 text-red-700'
              }`}>
                {session.statut === 'A_VENIR' ? 'À venir' : session.statut === 'TERMINEE' ? 'Terminée' : session.statut}
              </span>
              <span className="text-xs text-slate-500">• {session.type}</span>
              {session.recyclage.aRecycler && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Recyclable ({session.recyclage.periodiciteMois}m)
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-slate-900 mt-1 line-clamp-1">
              {session.libelle}
            </h2>
            <p className="text-xs text-slate-500">
              {session.organisme} • Du {session.dateDebut} au {session.dateFin} ({session.dureeJours}j / {session.dureeHeures}h)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onEditFullSession && (
              <button
                onClick={() => {
                  onClose();
                  onEditFullSession(session);
                }}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60"
                title="Modifier tous les champs de la session"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto text-xs">
          {[
            { id: 'synthese', label: 'Vue d\'ensemble' },
            { id: 'logistique', label: 'Logistique & Émargement' },
            { id: 'opco', label: 'Suivi Financier OPCO' },
            { id: 'chaud', label: 'Évaluation à Chaud' },
            { id: 'froid', label: 'Évaluation à Froid (3 mois)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SYNTHESE */}
          {activeTab === 'synthese' && (
            <div className="space-y-6">
              {/* Top stats bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500">Participants</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {session.participants.length} inscrits
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500">Coût pédagogique</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {session.coutPedagogiqueTotal} € HT
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500">Prise en charge OPCO</span>
                  <p className="text-sm font-semibold text-emerald-700 mt-0.5">
                    {session.opco.declare ? `${session.opco.montantPrisEnCharge} €` : '0 €'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500">Reste à charge</span>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {Math.max(0, session.coutPedagogiqueTotal - (session.opco.declare ? session.opco.montantPrisEnCharge : 0))} €
                  </p>
                </div>
              </div>

              {/* Description */}
              {session.description && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Objectifs & Programme
                  </h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {session.description}
                  </p>
                </div>
              )}

              {/* Participants Management Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      Collaborateurs inscrits ({participants.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Gérez les salariés inscrits ou ajoutez de nouveaux participants à cette session
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddCollab(!showAddCollab)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>
                      {showAddCollab
                        ? 'Fermer l\'ajout'
                        : `Inscrire des collaborateurs (${availableCollaborateurs.length} disponible${availableCollaborateurs.length > 1 ? 's' : ''})`}
                    </span>
                  </button>
                </div>

                {/* Expandable Collaborator Selection Box */}
                {showAddCollab && (
                  <div className="p-3.5 bg-blue-50/40 border border-blue-200 rounded-xl space-y-3 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                        <Plus className="h-4 w-4 text-blue-600" />
                        <span>Sélectionner parmi les collaborateurs non inscrits ({filteredAvailable.length})</span>
                      </div>

                      {/* Search & Dept Filters */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            value={collabSearch}
                            onChange={(e) => setCollabSearch(e.target.value)}
                            placeholder="Nom, matricule, poste..."
                            className="text-xs pl-8 pr-2 py-1.5 rounded-lg border border-slate-300 w-40 sm:w-48 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <select
                          value={collabDeptFilter}
                          onChange={(e) => setCollabDeptFilter(e.target.value)}
                          className="text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="ALL">Tous départements</option>
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Available Collaborator List */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto bg-white">
                      {filteredAvailable.map((collab) => (
                        <div
                          key={collab.id}
                          className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                              {collab.prenom[0]}{collab.nom[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-900">
                                  {collab.nom.toUpperCase()} {collab.prenom}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {collab.matricule}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {collab.poste} • <span className="text-slate-600">{collab.departement}</span>
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddParticipant(collab.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Inscrire</span>
                          </button>
                        </div>
                      ))}

                      {filteredAvailable.length === 0 && (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          {availableCollaborateurs.length === 0
                            ? 'Tous les collaborateurs sont déjà inscrits à cette formation.'
                            : 'Aucun collaborateur ne correspond à ces critères.'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enrolled Collaborators List */}
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {participants.map((p) => {
                    const collab = collabMap.get(p.collaborateurId);
                    return (
                      <div key={p.collaborateurId} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                            {collab ? `${collab.prenom[0]}${collab.nom[0]}` : '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {collab ? `${collab.nom.toUpperCase()} ${collab.prenom}` : 'Collaborateur inconnu'}
                              </span>
                              {collab?.matricule && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {collab.matricule}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {collab?.poste} • {collab?.departement}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            p.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                            p.status === 'JUSTIFIE' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {p.status === 'PRESENT' ? 'Présent' : p.status === 'ABSENT' ? 'Absent' : p.status === 'JUSTIFIE' ? 'Justifié' : 'En attente'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(p.collaborateurId)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Désinscrire ce collaborateur de la session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {participants.length === 0 && (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <Users className="h-8 w-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-medium text-slate-600">Aucun collaborateur inscrit pour l'instant.</p>
                      <p className="text-[11px] text-slate-400">Cliquez sur « Inscrire des collaborateurs » ci-dessus pour composer votre groupe.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGISTIQUE & EMARGEMENT */}
          {activeTab === 'logistique' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Contrôles logistiques
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Room */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={logistique.salleReservee}
                        onChange={(e) => handleToggleRoom(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                      <span className="text-xs font-semibold text-slate-800">Salle réservée</span>
                    </label>
                    <input
                      type="text"
                      value={logistique.nomSalle}
                      onChange={(e) => handleRoomName(e.target.value)}
                      placeholder="Nom de la salle..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md"
                    />
                  </div>

                  {/* Meals */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={logistique.plateauxRepasCommandes}
                        onChange={(e) => handleToggleMeals(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                      <span className="text-xs font-semibold text-slate-800">Plateaux repas commandés</span>
                    </label>
                    <input
                      type="text"
                      value={logistique.detailsRestauration}
                      onChange={(e) => handleMealDetails(e.target.value)}
                      placeholder="Détails restauration..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md"
                    />
                  </div>

                  {/* Convocation */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={logistique.convocationEnvoyee}
                        onChange={(e) => handleToggleConvocation(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                      <span className="text-xs font-semibold text-slate-800">Convocations envoyées</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {logistique.convocationEnvoyee
                        ? `Envoyée le ${logistique.dateConvocation || 'récemment'}`
                        : 'À transmettre 15 jours avant la session'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Emargement table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Feuille d'émargement & Présences annoncées
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Cochez la présence pour chaque collaborateur
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {participants.map((p) => {
                    const collab = collabMap.get(p.collaborateurId);
                    return (
                      <div key={p.collaborateurId} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {collab ? `${collab.nom.toUpperCase()} ${collab.prenom}` : p.collaborateurId}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Matricule: {collab?.matricule} • {collab?.poste}
                          </p>
                        </div>

                        {/* Status selector buttons */}
                        <div className="flex items-center gap-1.5">
                          {(['PRESENT', 'ABSENT', 'JUSTIFIE', 'EN_ATTENTE'] as PresenceStatus[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handlePresenceChange(p.collaborateurId, st)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                                p.status === st
                                  ? st === 'PRESENT'
                                    ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                    : st === 'ABSENT'
                                    ? 'bg-red-600 text-white font-semibold'
                                    : st === 'JUSTIFIE'
                                    ? 'bg-amber-600 text-white font-semibold'
                                    : 'bg-slate-700 text-white font-semibold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {st === 'PRESENT' ? 'Présent' : st === 'ABSENT' ? 'Absent' : st === 'JUSTIFIE' ? 'Justifié' : 'Attente'}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OPCO */}
          {activeTab === 'opco' && (
            <div className="space-y-5">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-indigo-900">
                    Dossier de Financement OPCO
                  </h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Gestion de la subrogation, montants accordés et règlements OPCO
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opco.declare}
                    onChange={(e) => handleOpcoField('declare', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-xs font-semibold text-slate-800">Dossier déposé</span>
                </label>
              </div>

              {opco.declare ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nom de l'OPCO
                      </label>
                      <input
                        type="text"
                        value={opco.nomOpco}
                        onChange={(e) => handleOpcoField('nomOpco', e.target.value)}
                        placeholder="Ex: OPCO Atlas, AKTO, OPCO 2i..."
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Numéro de dossier / accord
                      </label>
                      <input
                        type="text"
                        value={opco.numeroDossier}
                        onChange={(e) => handleOpcoField('numeroDossier', e.target.value)}
                        placeholder="Ex: DOS-2026-98124"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  {/* Subrogation toggle */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                      Règlement & Subrogation
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="detailSubrogation"
                          checked={opco.subrogation === true}
                          onChange={() => handleOpcoField('subrogation', true)}
                        />
                        <span className="font-medium text-slate-800">
                          Avec subrogation (Paiement direct de l'organisme par l'OPCO)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="detailSubrogation"
                          checked={opco.subrogation === false}
                          onChange={() => handleOpcoField('subrogation', false)}
                        />
                        <span className="font-medium text-slate-800">
                          Sans subrogation (Remboursement de l'entreprise sur justificatifs)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Montant pris en charge (€)
                      </label>
                      <input
                        type="number"
                        value={opco.montantPrisEnCharge}
                        onChange={(e) => handleOpcoField('montantPrisEnCharge', parseFloat(e.target.value) || 0)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-semibold text-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Frais annexes pris en charge (€)
                      </label>
                      <input
                        type="number"
                        value={opco.fraisAnnexesPrisEnCharge}
                        onChange={(e) => handleOpcoField('fraisAnnexesPrisEnCharge', parseFloat(e.target.value) || 0)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Statut du dossier OPCO
                      </label>
                      <select
                        value={opco.statut}
                        onChange={(e) => handleOpcoField('statut', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="NON_DEPOSE">Non déposé</option>
                        <option value="EN_INSTRUCTION">En instruction</option>
                        <option value="ACCORDE">Accordé (Accord de prise en charge)</option>
                        <option value="EN_ATTENTE_REGLEMENT">En attente de règlement</option>
                        <option value="REGLE_CLOTURE">Réglé / Clôturé</option>
                        <option value="REFUSE">Refusé</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-emerald-900">Synthèse financière session :</p>
                      <p className="text-emerald-700">
                        Coût total : {session.coutPedagogiqueTotal + (session.fraisAnnexesTotal || 0)} € • Financement OPCO : {opco.montantPrisEnCharge + opco.fraisAnnexesPrisEnCharge} €
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-emerald-800">Reste à charge entreprise</span>
                      <p className="text-base font-bold text-emerald-900">
                        {Math.max(0, (session.coutPedagogiqueTotal + (session.fraisAnnexesTotal || 0)) - (opco.montantPrisEnCharge + opco.fraisAnnexesPrisEnCharge))} €
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                  Cette formation n'est pas encore déclarée auprès d'un OPCO. Cochez "Dossier déposé" pour renseigner le suivi.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EVALUATION A CHAUD */}
          {activeTab === 'chaud' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                  Encart d'évaluation à chaud (Recueillie en fin de session)
                </h3>

                <div className="space-y-4">
                  {/* Automatic Calculated Global Score (Read-only) */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-800">
                          Note globale calculée
                        </label>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Automatique (Moyenne des 3 critères)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Calculée en temps réel d'après le contenu, la pédagogie et la logistique
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(evalChaud.noteGlobale)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-bold text-sm">
                        {evalChaud.noteGlobale > 0 ? `${evalChaud.noteGlobale.toFixed(1)} / 5` : '— / 5'}
                      </div>
                    </div>
                  </div>

                  {/* 3 Complementary Notes Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        1. Contenu / Programme
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={evalChaud.noteContenu !== undefined && evalChaud.noteContenu > 0 ? evalChaud.noteContenu : ''}
                          onChange={(e) => handleEvalChaudSubNote('noteContenu', parseFloat(e.target.value) || 0)}
                          placeholder="Note / 5"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-900"
                        />
                        <span className="text-xs text-slate-400 font-medium">/5</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        2. Pédagogie formateur
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={evalChaud.noteFormateur !== undefined && evalChaud.noteFormateur > 0 ? evalChaud.noteFormateur : ''}
                          onChange={(e) => handleEvalChaudSubNote('noteFormateur', parseFloat(e.target.value) || 0)}
                          placeholder="Note / 5"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-900"
                        />
                        <span className="text-xs text-slate-400 font-medium">/5</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        3. Organisation / Logistique
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={evalChaud.noteOrganisation !== undefined && evalChaud.noteOrganisation > 0 ? evalChaud.noteOrganisation : ''}
                          onChange={(e) => handleEvalChaudSubNote('noteOrganisation', parseFloat(e.target.value) || 0)}
                          placeholder="Note / 5"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-900"
                        />
                        <span className="text-xs text-slate-400 font-medium">/5</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Commentaire général & Verbatim participants
                    </label>
                    <textarea
                      rows={2}
                      value={evalChaud.commentaire || ''}
                      onChange={(e) => {
                        setEvalChaud((prev) => ({ ...prev, commentaire: e.target.value, effectuee: true }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Commentaire de synthèse des évaluations stagiaires..."
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Points forts relevés</label>
                      <input
                        type="text"
                        value={evalChaud.pointsForts || ''}
                        onChange={(e) => {
                          setEvalChaud((prev) => ({ ...prev, pointsForts: e.target.value, effectuee: true }));
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Ex: Exercices pratiques, disponibilité du formateur..."
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Axes d'amélioration</label>
                      <input
                        type="text"
                        value={evalChaud.axesAmelioration || ''}
                        onChange={(e) => {
                          setEvalChaud((prev) => ({ ...prev, axesAmelioration: e.target.value, effectuee: true }));
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Ex: Prévoir 1 journée supplémentaire..."
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EVALUATION A FROID (3 MOIS) */}
          {activeTab === 'froid' && (
            <div className="space-y-5">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <span>Notification & Mesure d'impact à 3 mois</span>
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    Date cible : {evalFroid.datePrevue}
                  </span>
                </div>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  L'évaluation à froid s'effectue auprès du manager et du collaborateur 3 mois après la fin de formation afin d'évaluer la mise en pratique effective et l'impact opérationnel sur le poste de travail.
                </p>
              </div>

              {/* Notification manager trigger */}
              <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between bg-white">
                <div>
                  <span className="text-xs font-semibold text-slate-900">
                    Rappel au gestionnaire de formation
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {evalFroid.rappelEnvoye
                      ? `Rappel envoyé au gestionnaire le ${evalFroid.dateRappel}`
                      : 'Envoyez un rappel pour lancer la campagne d\'évaluation auprès des managers'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerColdReminder}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    evalFroid.rappelEnvoye
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{evalFroid.rappelEnvoye ? 'Rappel déjà envoyé' : 'Déclencher la notification 3 mois'}</span>
                </button>
              </div>

              {/* Cold eval feedback form */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-4">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Retour managérial & Impact opérationnel
                </h4>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mise en pratique des compétences au poste
                  </label>
                  <select
                    value={evalFroid.competencesMisesEnPratique || ''}
                    onChange={(e) => {
                      handleColdEvalSubmit({ competencesMisesEnPratique: e.target.value });
                    }}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- Sélectionner un niveau d'application --</option>
                    <option value="Totalement appliquées au quotidien">Totalement appliquées au quotidien</option>
                    <option value="Partiellement appliquées">Partiellement appliquées (quelques tâches)</option>
                    <option value="Non appliquées / Pas d'opportunité">Non appliquées / Pas d'opportunité immédiate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Note d'impact sur la performance / productivité (sur 5)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleColdEvalSubmit({ noteImpactOperationnel: star })}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            (evalFroid.noteImpactOperationnel || 0) >= star
                              ? 'fill-indigo-500 text-indigo-500'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-slate-700 ml-2">
                      {evalFroid.noteImpactOperationnel ? `${evalFroid.noteImpactOperationnel} / 5` : 'Non renseigné'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Avis du manager / tuteur
                  </label>
                  <textarea
                    rows={2}
                    value={evalFroid.retourManager || ''}
                    onChange={(e) => {
                      handleColdEvalSubmit({ retourManager: e.target.value });
                    }}
                    placeholder="Constat du responsable hiérarchique sur l'autonomie et les résultats..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-3 text-xs">
            {onDeleteSession && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Supprimer cette session"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Supprimer la session</span>
              </button>
            )}

            {saveSuccessMsg && (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Modifications enregistrées !
              </span>
            )}
            {!saveSuccessMsg && hasUnsavedChanges && (
              <span className="text-amber-700 font-medium">Modifications non enregistrées</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Fermer
            </button>
            <button
              id="btn-save-session-details"
              onClick={handleSaveChanges}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/20 transition-all active:scale-[0.99] cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                  Cette action est définitive et irréversible.
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 bg-stone-50 p-3.5 rounded-xl border border-stone-200 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement la session <strong>« {session.libelle} »</strong> ?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSession) {
                    onDeleteSession(session.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }
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
