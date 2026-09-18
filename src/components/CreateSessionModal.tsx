import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  Building2, 
  Clock, 
  Euro, 
  Users, 
  BookmarkCheck, 
  RefreshCw, 
  Search, 
  Layers, 
  Info,
  SlidersHorizontal
} from 'lucide-react';
import { 
  Collaborateur, 
  FormationSession, 
  FormationType, 
  ParticipantPresence, 
  SessionStatus, 
  OPCOStatus 
} from '../types';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: FormationSession) => void;
  collaborateurs: Collaborateur[];
  initialData?: Partial<FormationSession>;
  preselectedCollaborateurIds?: string[];
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  collaborateurs,
  initialData,
  preselectedCollaborateurIds = []
}) => {
  if (!isOpen) return null;

  // Tabs for structured clean creation
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'participants' | 'logistique' | 'opco' | 'recyclage'>('general');

  // Form states
  const [libelle, setLibelle] = useState(initialData?.libelle || '');
  const [organisme, setOrganisme] = useState(initialData?.organisme || '');
  const [type, setType] = useState<FormationType>(initialData?.type || 'Obligatoire');
  const [dateDebut, setDateDebut] = useState(initialData?.dateDebut || new Date().toISOString().slice(0, 10));
  const [dateFin, setDateFin] = useState(initialData?.dateFin || new Date().toISOString().slice(0, 10));
  const [horaires, setHoraires] = useState(initialData?.horaires || '09:00 - 17:00');
  const [dureeHeures, setDureeHeures] = useState<number>(initialData?.dureeHeures || 14);
  const [dureeJours, setDureeJours] = useState<number>(initialData?.dureeJours || 2);
  const [coutPedagogiqueTotal, setCoutPedagogiqueTotal] = useState<number>(initialData?.coutPedagogiqueTotal || 1500);
  const [fraisAnnexesTotal, setFraisAnnexesTotal] = useState<number>(initialData?.fraisAnnexesTotal || 0);
  const [statut, setStatut] = useState<SessionStatus>(initialData?.statut || 'A_VENIR');
  const [description, setDescription] = useState(initialData?.description || '');

  // Participants selection
  const [selectedCollabIds, setSelectedCollabIds] = useState<string[]>(() => {
    if (initialData?.participants) {
      return initialData.participants.map((p) => p.collaborateurId);
    }
    return preselectedCollaborateurIds;
  });
  const [collabSearch, setCollabSearch] = useState('');
  const [collabDeptFilter, setCollabDeptFilter] = useState('ALL');

  // Logistics
  const [salleReservee, setSalleReservee] = useState(initialData?.logistique?.salleReservee || false);
  const [nomSalle, setNomSalle] = useState(initialData?.logistique?.nomSalle || '');
  const [plateauxRepasCommandes, setPlateauxRepasCommandes] = useState(initialData?.logistique?.plateauxRepasCommandes || false);
  const [detailsRestauration, setDetailsRestauration] = useState(initialData?.logistique?.detailsRestauration || '');
  const [convocationEnvoyee, setConvocationEnvoyee] = useState(initialData?.logistique?.convocationEnvoyee || false);
  const [notesLogistiques, setNotesLogistiques] = useState(initialData?.logistique?.notesLogistiques || '');

  // OPCO
  const [opcoDeclare, setOpcoDeclare] = useState(initialData?.opco?.declare || true);
  const [nomOpco, setNomOpco] = useState(initialData?.opco?.nomOpco || '');
  const [numeroDossier, setNumeroDossier] = useState(initialData?.opco?.numeroDossier || '');
  const [subrogation, setSubrogation] = useState(initialData?.opco?.subrogation ?? true);
  const [montantPrisEnCharge, setMontantPrisEnCharge] = useState<number>(initialData?.opco?.montantPrisEnCharge || 1200);
  const [fraisAnnexesPrisEnCharge, setFraisAnnexesPrisEnCharge] = useState<number>(initialData?.opco?.fraisAnnexesPrisEnCharge || 0);
  const [statutOpco, setStatutOpco] = useState<OPCOStatus>(initialData?.opco?.statut || 'EN_INSTRUCTION');
  const [commentairesOpco, setCommentairesOpco] = useState(initialData?.opco?.commentaires || '');

  // Recycling
  const [aRecycler, setARecycler] = useState(initialData?.recyclage?.aRecycler || false);
  const [periodiciteMois, setPeriodiciteMois] = useState<number>(initialData?.recyclage?.periodiciteMois || 24);
  const [intituleRecyclage, setIntituleRecyclage] = useState(initialData?.recyclage?.intituleRecyclage || '');

  // Update dates if starting changes
  const handleDateDebutChange = (newDate: string) => {
    setDateDebut(newDate);
    if (newDate > dateFin) {
      setDateFin(newDate);
    }
  };

  // Toggle collaborator
  const handleToggleCollab = (id: string) => {
    if (selectedCollabIds.includes(id)) {
      setSelectedCollabIds(selectedCollabIds.filter((item) => item !== id));
    } else {
      setSelectedCollabIds([...selectedCollabIds, id]);
    }
  };

  // Departments list for filter
  const departments = Array.from(new Set(collaborateurs.map((c) => c.departement))).sort();

  // Filtered list of collaborators - sorted alphabetically by last name (nom de famille)
  const filteredCollaborateurs = collaborateurs
    .filter((c) => {
      const matchesDept = collabDeptFilter === 'ALL' || c.departement === collabDeptFilter;
      const q = collabSearch.toLowerCase();
      const matchesSearch = 
        c.nom.toLowerCase().includes(q) ||
        c.prenom.toLowerCase().includes(q) ||
        c.matricule.toLowerCase().includes(q) ||
        c.poste.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    })
    .sort((a, b) => 
      a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }) || 
      a.prenom.localeCompare(b.prenom, 'fr')
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!libelle.trim()) {
      alert('Veuillez saisir le libellé de la formation.');
      return;
    }

    // Auto-compute 3-month target date for cold evaluation
    const finishDate = new Date(dateFin);
    const datePrevueFroid = new Date(finishDate);
    datePrevueFroid.setMonth(datePrevueFroid.getMonth() + 3);

    const participantsPresence: ParticipantPresence[] = selectedCollabIds.map((collabId) => {
      const existing = initialData?.participants?.find((p) => p.collaborateurId === collabId);
      return existing || {
        collaborateurId: collabId,
        status: 'PRESENT'
      };
    });

    const newSession: FormationSession = {
      id: initialData?.id || `sess-${Date.now()}`,
      libelle: libelle.trim(),
      organisme: organisme.trim() || 'Organisme certifié',
      type,
      dateDebut,
      dateFin,
      horaires,
      dureeHeures: Number(dureeHeures) || 7,
      dureeJours: Number(dureeJours) || 1,
      coutPedagogiqueTotal: Number(coutPedagogiqueTotal) || 0,
      fraisAnnexesTotal: Number(fraisAnnexesTotal) || 0,
      statut,
      participants: participantsPresence,
      logistique: {
        salleReservee,
        nomSalle: salleReservee ? nomSalle.trim() : '',
        plateauxRepasCommandes,
        detailsRestauration: plateauxRepasCommandes ? detailsRestauration.trim() : '',
        convocationEnvoyee,
        dateConvocation: convocationEnvoyee ? (initialData?.logistique?.dateConvocation || new Date().toISOString().slice(0, 10)) : undefined,
        notesLogistiques: notesLogistiques.trim()
      },
      evaluationChaud: initialData?.evaluationChaud || {
        effectuee: false,
        noteGlobale: 0,
        noteContenu: 0,
        noteFormateur: 0,
        noteOrganisation: 0
      },
      evaluationFroid: initialData?.evaluationFroid || {
        requise: true,
        datePrevue: datePrevueFroid.toISOString().slice(0, 10),
        rappelEnvoye: false,
        effectuee: false
      },
      opco: {
        declare: opcoDeclare,
        nomOpco: opcoDeclare ? nomOpco.trim() : '',
        numeroDossier: opcoDeclare ? numeroDossier.trim() : '',
        subrogation,
        montantPrisEnCharge: opcoDeclare ? Number(montantPrisEnCharge) || 0 : 0,
        fraisAnnexesPrisEnCharge: opcoDeclare ? Number(fraisAnnexesPrisEnCharge) || 0 : 0,
        statut: opcoDeclare ? statutOpco : 'NON_DEPOSE',
        commentaires: commentairesOpco.trim()
      },
      recyclage: {
        aRecycler,
        periodiciteMois: aRecycler ? Number(periodiciteMois) || 24 : 0,
        intituleRecyclage: aRecycler ? intituleRecyclage.trim() || `Recyclage ${libelle}` : undefined
      },
      description: description.trim(),
      createdAt: initialData?.createdAt || new Date().toISOString()
    };

    onSave(newSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                SF
              </span>
              <h2 className="text-base font-semibold text-slate-900">
                {initialData?.id ? 'Modifier la session de formation' : 'Créer une nouvelle session de formation'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Renseignez les détails pédagogiques, logistiques, financiers OPCO et le suivi de recyclage
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-tabs for clean ergonomics */}
        <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto text-xs">
          {[
            { id: 'general', label: '1. Informations générales', count: null },
            { id: 'participants', label: '2. Participants', count: selectedCollabIds.length },
            { id: 'logistique', label: '3. Logistique', count: salleReservee || plateauxRepasCommandes ? 'Configuré' : null },
            { id: 'opco', label: '4. Suivi OPCO', count: opcoDeclare ? `${montantPrisEnCharge} €` : 'Non' },
            { id: 'recyclage', label: '5. Recyclage & Éval.', count: aRecycler ? `${periodiciteMois}m` : null }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-3 px-3 font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 font-semibold text-slate-700">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: General Info */}
          {activeSubTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Libellé de la formation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  placeholder="Ex: Habilitation Électrique B1V, Sauveteur Secouriste du Travail (SST), Power BI Avancé..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organisme de formation
                  </label>
                  <input
                    type="text"
                    value={organisme}
                    onChange={(e) => setOrganisme(e.target.value)}
                    placeholder="Ex: APAVE, Cegos, INRS, DataSkills..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type de formation
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as FormationType)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Obligatoire">Obligatoire</option>
                    <option value="Développement des compétences">Développement des compétences</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              {/* Dates & Durations */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date début</label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => handleDateDebutChange(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date fin</label>
                  <input
                    type="date"
                    value={dateFin}
                    min={dateDebut}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Durée en jours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={dureeJours}
                    onChange={(e) => setDureeJours(parseFloat(e.target.value) || 1)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Durée en heures</label>
                  <input
                    type="number"
                    min="1"
                    value={dureeHeures}
                    onChange={(e) => setDureeHeures(parseInt(e.target.value) || 7)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Financials & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Coût pédagogique HT (€)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={coutPedagogiqueTotal}
                      onChange={(e) => setCoutPedagogiqueTotal(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300"
                    />
                    <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">€</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frais annexes (repas, hôtel) (€)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={fraisAnnexesTotal}
                      onChange={(e) => setFraisAnnexesTotal(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300"
                    />
                    <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">€</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Statut de la session
                  </label>
                  <select
                    value={statut}
                    onChange={(e) => setStatut(e.target.value as SessionStatus)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="A_VENIR">À venir (Planifiée)</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINEE">Terminée</option>
                    <option value="ANNULEE">Annulée</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objectifs pédagogiques & remarques
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Compétences visées, prérequis, matériel spécifique nécessaire..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Participants Picker from Dimension Table */}
          {activeSubTab === 'participants' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Sélection des participants ({selectedCollabIds.length} sélectionné{selectedCollabIds.length > 1 ? 's' : ''})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Piochez parmi la table de dimension collaborateurs de votre entreprise
                  </p>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={collabSearch}
                      onChange={(e) => setCollabSearch(e.target.value)}
                      placeholder="Nom, matricule..."
                      className="text-xs pl-8 pr-2 py-1.5 rounded-lg border border-slate-300 w-36 sm:w-48 bg-white"
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

              {/* Collaborators List Box */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {filteredCollaborateurs.map((collab) => {
                  const isSelected = selectedCollabIds.includes(collab.id);
                  return (
                    <div
                      key={collab.id}
                      onClick={() => handleToggleCollab(collab.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {collab.nom.toUpperCase()} {collab.prenom}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {collab.matricule}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {collab.poste} • <span className="text-slate-600">{collab.departement}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredCollaborateurs.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Aucun collaborateur trouvé pour cette recherche.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Logistics */}
          {activeSubTab === 'logistique' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Ces éléments logistiques permettent d'anticiper la réservation de salle, la commande des déjeuners et la transmission des convocations.
                </p>
              </div>

              {/* Room Reservation */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={salleReservee}
                      onChange={(e) => setSalleReservee(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs font-semibold text-slate-900">
                      Salle de formation réservée
                    </span>
                  </label>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    salleReservee ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                  }`}>
                    {salleReservee ? 'Confirmée' : 'À réserver'}
                  </span>
                </div>

                {salleReservee && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Nom ou numéro de la salle / lieu
                    </label>
                    <input
                      type="text"
                      value={nomSalle}
                      onChange={(e) => setNomSalle(e.target.value)}
                      placeholder="Ex: Salle Magellan (1er étage), Centre APAVE Lyon, etc."
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                )}
              </div>

              {/* Catering / Meal Trays */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plateauxRepasCommandes}
                      onChange={(e) => setPlateauxRepasCommandes(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs font-semibold text-slate-900">
                      Plateaux repas / Restauration commandés
                    </span>
                  </label>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    plateauxRepasCommandes ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {plateauxRepasCommandes ? 'Commandés' : 'Non commandés'}
                  </span>
                </div>

                {plateauxRepasCommandes && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Détails de la restauration (fournisseur, régimes spécifiques)
                    </label>
                    <input
                      type="text"
                      value={detailsRestauration}
                      onChange={(e) => setDetailsRestauration(e.target.value)}
                      placeholder="Ex: 5 plateaux traiteur dont 1 végétarien, livraison 12h00"
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                )}
              </div>

              {/* Invitation Letters */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convocationEnvoyee}
                    onChange={(e) => setConvocationEnvoyee(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-semibold text-slate-900">
                    Convocations officielles envoyées aux participants
                  </span>
                </label>
              </div>

              {/* Additional Logistics Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes logistiques complémentaires
                </label>
                <textarea
                  rows={2}
                  value={notesLogistiques}
                  onChange={(e) => setNotesLogistiques(e.target.value)}
                  placeholder="Ex: Matériel informatique requis, badges visiteurs à préparer à l'accueil..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          )}

          {/* TAB 4: OPCO Tracking */}
          {activeSubTab === 'opco' && (
            <div className="space-y-4">
              <div className="p-4 border border-slate-200 rounded-xl bg-indigo-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={opcoDeclare}
                      onChange={(e) => setOpcoDeclare(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-xs font-semibold text-slate-900">
                      Formation déclarée à l'OPCO (Prise en charge financière)
                    </span>
                  </label>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    opcoDeclare ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {opcoDeclare ? 'Déclarée' : 'Non déclarée'}
                  </span>
                </div>
              </div>

              {opcoDeclare && (
                <div className="space-y-4 border border-slate-200 p-4 rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nom de l'OPCO
                      </label>
                      <input
                        type="text"
                        value={nomOpco}
                        onChange={(e) => setNomOpco(e.target.value)}
                        placeholder="Ex : Opco mobilité"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        N° de dossier / Accord de prise en charge
                      </label>
                      <input
                        type="text"
                        value={numeroDossier}
                        onChange={(e) => setNumeroDossier(e.target.value)}
                        placeholder="Ex: DOS-2026-98124"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Mode de règlement / Subrogation
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="subrogation"
                          checked={subrogation === true}
                          onChange={() => setSubrogation(true)}
                          className="text-slate-900"
                        />
                        <span className="text-xs text-slate-800 font-medium">
                          Avec subrogation (l'OPCO paie directement l'organisme)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="subrogation"
                          checked={subrogation === false}
                          onChange={() => setSubrogation(false)}
                          className="text-slate-900"
                        />
                        <span className="text-xs text-slate-800 font-medium">
                          Sans subrogation (remboursement à l'entreprise sur facture)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Montant pédagogique pris en charge (€)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={montantPrisEnCharge}
                          onChange={(e) => setMontantPrisEnCharge(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300 font-medium text-emerald-700"
                        />
                        <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">€</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Frais annexes pris en charge (€)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={fraisAnnexesPrisEnCharge}
                          onChange={(e) => setFraisAnnexesPrisEnCharge(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300"
                        />
                        <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">€</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Statut du dossier OPCO
                      </label>
                      <select
                        value={statutOpco}
                        onChange={(e) => setStatutOpco(e.target.value as OPCOStatus)}
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

                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-emerald-900 font-medium">
                      Reste à charge estimé pour l'entreprise :
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      {Math.max(0, (coutPedagogiqueTotal + fraisAnnexesTotal) - (montantPrisEnCharge + fraisAnnexesPrisEnCharge))} €
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Recycling & Evaluations */}
          {activeSubTab === 'recyclage' && (
            <div className="space-y-4">
              {/* Recycling Tag & Periodicity */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aRecycler}
                      onChange={(e) => setARecycler(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs font-semibold text-slate-900">
                      Formation avec obligation de recyclage périodique
                    </span>
                  </label>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    aRecycler ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {aRecycler ? 'Recyclable' : 'Formation unique'}
                  </span>
                </div>

                {aRecycler && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Périodicité de validité (en mois)
                      </label>
                      <select
                        value={periodiciteMois}
                        onChange={(e) => setPeriodiciteMois(parseInt(e.target.value))}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value={12}>12 mois (1 an) - ex: Sécurité spécifique</option>
                        <option value={24}>24 mois (2 ans) - ex: SST Secourisme</option>
                        <option value={36}>36 mois (3 ans) - ex: Habilitation Électrique</option>
                        <option value={60}>60 mois (5 ans) - ex: CACES Chariots</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Intitulé de la session de recyclage
                      </label>
                      <input
                        type="text"
                        value={intituleRecyclage}
                        onChange={(e) => setIntituleRecyclage(e.target.value)}
                        placeholder={`Ex: MAC SST, Recyclage ${libelle || 'habilitation'}`}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cold evaluation notice */}
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span>Évaluation à froid (Rappel automatique à 3 mois)</span>
                </h4>
                <p className="text-xs text-slate-600">
                  Une notification automatique sera générée pour le gestionnaire <strong>3 mois après la date de fin</strong> de la session ({dateFin}) afin de déclencher l'évaluation de l'impact opérationnel auprès du manager.
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {selectedCollabIds.length} participant{selectedCollabIds.length > 1 ? 's' : ''} • {coutPedagogiqueTotal} € HT
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                id="btn-submit-session"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/20 transition-all active:scale-[0.99]"
              >
                {initialData?.id ? 'Enregistrer les modifications' : 'Créer la session de formation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
