import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Clock, 
  Users, 
  Euro, 
  AlertTriangle, 
  RefreshCw, 
  Award, 
  GraduationCap, 
  Plus, 
  ArrowRight,
  ClipboardCheck,
  Search,
  Shield,
  Briefcase,
  BarChart2,
  BarChart3,
  Layers,
  TrendingUp,
  Percent
} from 'lucide-react';
import { 
  Collaborateur, 
  FormationSession, 
  SouhaitFormation, 
  ActiveTab,
  CollaborateurStatut,
  STATUT_LABELS
} from '../types';
import { 
  calculateWishMatching, 
  calculateGenderEquality, 
  calculateOPCOStats, 
  getCollaborateurHistory,
  calculateColdEvaluationAlerts,
  calculateRecyclingAlerts,
  calculateLogisticsAlerts,
  calculateDimensionTrainingAnalytics,
  DimensionAnalyticsItem
} from '../utils/analytics';

interface DashboardViewProps {
  sessions: FormationSession[];
  collaborateurs: Collaborateur[];
  souhaits: SouhaitFormation[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSession: (session: FormationSession) => void;
  onOpenCreateSession: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sessions,
  collaborateurs,
  souhaits,
  setActiveTab,
  onSelectSession,
  onOpenCreateSession
}) => {
  const wishStats = calculateWishMatching(souhaits, sessions, collaborateurs);
  const genderStats = calculateGenderEquality(collaborateurs, sessions);
  const totalFormesGender = genderStats.femmesFormees + genderStats.hommesFormes;
  const pctFemmes = totalFormesGender > 0 ? Math.round((genderStats.femmesFormees / totalFormesGender) * 100) : 50;
  const pctHommes = totalFormesGender > 0 ? 100 - pctFemmes : 50;
  const opcoStats = calculateOPCOStats(sessions);
  const coldAlerts = calculateColdEvaluationAlerts(sessions);
  const recyclingAlerts = calculateRecyclingAlerts(sessions, collaborateurs).filter(
    (a) => a.etat === 'EXPIRE' || a.etat === 'URGENT'
  );
  const logisticsAlerts = calculateLogisticsAlerts(sessions);

  // Dimension Analytics: analyze number and cost of training by 'sexe', 'departement', or 'statut'
  const [selectedDimension, setSelectedDimension] = useState<'statut' | 'sexe' | 'departement'>('statut');
  const [dimensionMetric, setDimensionMetric] = useState<'TOUT' | 'COUT' | 'NOMBRE'>('TOUT');

  const dimensionData = useMemo(() => {
    return calculateDimensionTrainingAnalytics(selectedDimension, collaborateurs, sessions);
  }, [selectedDimension, collaborateurs, sessions]);

  const dimensionMaxCost = useMemo(() => {
    return Math.max(...dimensionData.map((d) => d.coutTotal), 1);
  }, [dimensionData]);

  const dimensionMaxNombre = useMemo(() => {
    return Math.max(...dimensionData.map((d) => d.nombreFormations), 1);
  }, [dimensionData]);

  // Sorted alphabetically by last name (nom de famille)
  const sortedCollaborateurs = useMemo(() => {
    return [...collaborateurs].sort((a, b) => 
      a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }) || 
      a.prenom.localeCompare(b.prenom, 'fr')
    );
  }, [collaborateurs]);

  const [passportSearch, setPassportSearch] = useState('');
  const [selectedCollabId, setSelectedCollabId] = useState<string>(
    sortedCollaborateurs[0]?.id || ''
  );

  const filteredPassportCollaborateurs = useMemo(() => {
    if (!passportSearch.trim()) return sortedCollaborateurs;
    const q = passportSearch.toLowerCase().trim();
    return sortedCollaborateurs.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.prenom.toLowerCase().includes(q) ||
        c.matricule.toLowerCase().includes(q) ||
        c.departement.toLowerCase().includes(q) ||
        c.poste.toLowerCase().includes(q)
    );
  }, [sortedCollaborateurs, passportSearch]);

  const selectedCollab = 
    collaborateurs.find((c) => c.id === selectedCollabId) || 
    filteredPassportCollaborateurs[0] || 
    sortedCollaborateurs[0];

  const collabHistory = selectedCollab
    ? getCollaborateurHistory(selectedCollab.id, sessions, souhaits)
    : null;

  // Breakdown of sessions by formation type (Obligatoire, Développement des compétences, Autre)
  const typeBreakdown = useMemo(() => {
    if (!collabHistory) return { obligatoire: 0, devCompetence: 0, autre: 0 };
    let obligatoire = 0;
    let devCompetence = 0;
    let autre = 0;

    collabHistory.sessionsSuivies.forEach((s) => {
      const t = (s.type || '').toLowerCase();
      if (t.includes('obligatoire') || t.includes('sécurité')) {
        obligatoire++;
      } else if (t.includes('compétence') || t.includes('développement') || t.includes('métier') || t.includes('management') || t.includes('bureautique')) {
        devCompetence++;
      } else {
        autre++;
      }
    });

    return { obligatoire, devCompetence, autre };
  }, [collabHistory]);

  return (
    <div className="space-y-8">
      {/* Editorial Open-Air Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Accueil
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Indicateurs stratégiques, financement OPCO et conformité Qualiopi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCreateSession}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nouvelle session</span>
          </button>
        </div>
      </div>

      {/* 4 Clean Minimalist KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Adéquation Besoins */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Adéquation des Besoins</span>
              <Sparkles className="h-4 w-4 text-stone-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-stone-900">
                {wishStats.tauxCorrespondance}%
              </span>
              <span className="text-xs text-stone-500">
                {wishStats.souhaitsRealises + wishStats.souhaitsPlanifies}/{wishStats.totalSouhaits} pourvus
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <span>{wishStats.souhaitsRealises} réalisés</span>
            <span>{wishStats.souhaitsEnAttente} en attente</span>
          </div>
        </div>

        {/* KPI 2: Parité & Accès */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Parité Salariés Formés</span>
              <Users className="h-4 w-4 text-stone-400" />
            </div>

            {/* Format épuré : n F (x%) / n H (x%) */}
            <div className="mt-3 flex items-baseline">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                {genderStats.femmesFormees} F <span className="text-sm font-normal text-stone-500">({pctFemmes}%)</span>
                <span className="text-stone-300 font-normal mx-2">/</span>
                {genderStats.hommesFormes} H <span className="text-sm font-normal text-stone-500">({pctHommes}%)</span>
              </span>
            </div>

            {/* Visual ratio bar */}
            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden flex gap-0.5 mt-3 border border-stone-200/60">
              <div 
                style={{ width: `${pctFemmes}%` }} 
                className="bg-amber-400 h-full rounded-l-full transition-all duration-300"
                title={`Femmes : ${genderStats.femmesFormees} (${pctFemmes}%)`}
              />
              <div 
                style={{ width: `${pctHommes}%` }} 
                className="bg-emerald-500 h-full rounded-r-full transition-all duration-300"
                title={`Hommes : ${genderStats.hommesFormes} (${pctHommes}%)`}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 leading-snug flex items-center justify-between">
            <span>Total : {genderStats.totalFormes} formés</span>
            <div className="flex items-center gap-2.5 text-[11px]">
              <span className="inline-flex items-center gap-1 text-stone-600">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                F
              </span>
              <span className="inline-flex items-center gap-1 text-stone-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                H
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Financement OPCO */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Prise en charge OPCO</span>
              <Euro className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-emerald-600">
                {opcoStats.totalPrisEnChargeOPCO.toLocaleString('fr-FR')} €
              </span>
              <span className="text-xs text-stone-500">
                sur {opcoStats.totalBudgetFormations.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <span>Couverture : {opcoStats.tauxCouvertureGlobal}%</span>
            <span>Reste : {opcoStats.resteAChargeEntreprise.toLocaleString('fr-FR')} €</span>
          </div>
        </div>

        {/* KPI 4: Sessions actives */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Sessions en cours / À venir</span>
              <Clock className="h-4 w-4 text-stone-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-stone-900">
                {sessions.filter((s) => s.statut === 'A_VENIR' || s.statut === 'EN_COURS').length}
              </span>
              <span className="text-xs text-stone-500">
                sur {sessions.length} sessions
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <span>{sessions.filter((s) => s.statut === 'TERMINEE').length} terminées</span>
            <span className={recyclingAlerts.length > 0 ? 'text-amber-600 font-medium' : 'text-stone-400'}>
              {recyclingAlerts.length} recyclage(s)
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Alerts & Action Points (3 Columns) */}
      <div>
        <h2 className="text-sm font-semibold text-stone-900 mb-3">
          Points de vigilance & Relances
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recycling Priority */}
          <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-amber-600" />
                  <h3 className="text-xs font-semibold text-stone-900">Habilitations & Recyclages</h3>
                </div>
                <button
                  onClick={() => setActiveTab('recyclage')}
                  className="text-[11px] text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
                >
                  Voir tout ({recyclingAlerts.length})
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-1">Échéances SST, CACES, habilitations</p>

              <div className="mt-3 space-y-2">
                {recyclingAlerts.slice(0, 3).map((alert, i) => (
                  <div
                    key={`${alert.sessionId}-${alert.collaborateurId}-${i}`}
                    className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60 text-xs flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-stone-800 truncate">
                        {alert.collaborateur.prenom} {alert.collaborateur.nom}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {alert.intituleRecyclage}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      alert.etat === 'EXPIRE' 
                        ? 'bg-red-50 text-red-700 border border-red-200/60' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}>
                      {alert.etat === 'EXPIRE' ? 'Échu' : `${alert.joursRestants}j`}
                    </span>
                  </div>
                ))}

                {recyclingAlerts.length === 0 && (
                  <p className="text-xs text-stone-400 py-4 text-center">
                    Toutes les habilitations sont à jour.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cold Evaluations (3 months) */}
          <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-semibold text-stone-900">Évaluations à Froid (+3 mois)</h3>
                </div>
                <button
                  onClick={() => setActiveTab('evaluations')}
                  className="text-[11px] text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
                >
                  Voir tout ({coldAlerts.length})
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-1">Mesure d'impact et transfert de compétences</p>

              <div className="mt-3 space-y-2">
                {coldAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.sessionId}
                    onClick={() => {
                      const s = sessions.find((item) => item.id === alert.sessionId);
                      if (s) onSelectSession(s);
                    }}
                    className="p-2.5 rounded-lg bg-stone-50 hover:bg-stone-100/70 border border-stone-200/60 text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-stone-800 truncate">{alert.sessionLibelle}</p>
                      <p className="text-[11px] text-stone-500">Finie le {alert.dateFin}</p>
                    </div>
                    <span className="text-[10px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-100/80 shrink-0">
                      À évaluer
                    </span>
                  </div>
                ))}

                {coldAlerts.length === 0 && (
                  <p className="text-xs text-stone-400 py-4 text-center">
                    Aucune évaluation à froid en attente.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Logistics & Attendance */}
          <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-stone-600" />
                  <h3 className="text-xs font-semibold text-stone-900">Logistique & Émargement</h3>
                </div>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="text-[11px] text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
                >
                  Voir tout ({logisticsAlerts.length})
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-1">Convocations, salles et repas</p>

              <div className="mt-3 space-y-2">
                {logisticsAlerts.slice(0, 3).map((la) => (
                  <div
                    key={la.sessionId}
                    onClick={() => {
                      const s = sessions.find((item) => item.id === la.sessionId);
                      if (s) onSelectSession(s);
                    }}
                    className="p-2.5 rounded-lg bg-stone-50 hover:bg-stone-100/70 border border-stone-200/60 text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-stone-800 truncate">{la.sessionLibelle}</p>
                      <p className="text-[11px] text-stone-500">Début dans {la.joursAvantDebut} jour(s)</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {la.salleManquante && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Salle
                        </span>
                      )}
                      {la.convocationManquante && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                          Convocation
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {logisticsAlerts.length === 0 && (
                  <p className="text-xs text-stone-400 py-4 text-center">
                    Toute la logistique est prête.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Analytics Section: Sexe, Service, Statut */}
      <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-emerald-600" />
              <span>Analytique des Formations : Volume & Coût par Dimension</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Analysez la répartition budgétaire et le nombre de sessions selon le statut, le sexe ou le service
            </p>
          </div>

          {/* Dimension Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-lg text-xs self-start sm:self-auto">
            <button
              onClick={() => setSelectedDimension('statut')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                selectedDimension === 'statut'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Par Statut (EMP, CDT, CAD...)
            </button>
            <button
              onClick={() => setSelectedDimension('sexe')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                selectedDimension === 'sexe'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Par Sexe (F / H)
            </button>
            <button
              onClick={() => setSelectedDimension('departement')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                selectedDimension === 'departement'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Par Service
            </button>
          </div>
        </div>

        {/* Comparative Dual Graphs: Coût & Nombre de formations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graph 1: Coût Total (€) */}
          <div className="p-4 rounded-xl bg-stone-50/60 border border-stone-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <Euro className="h-3.5 w-3.5 text-emerald-600" />
                <span>Coût pédagogique engagé par {selectedDimension === 'statut' ? 'statut' : selectedDimension === 'sexe' ? 'genre' : 'service'}</span>
              </h3>
              <span className="text-[11px] text-stone-400 font-medium">Montant total</span>
            </div>

            <div className="space-y-3 pt-1">
              {dimensionData.map((item) => {
                const costPct = dimensionMaxCost > 0 ? (item.coutTotal / dimensionMaxCost) * 100 : 0;
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 truncate">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-500 font-medium">{item.pctBudget}% du budget</span>
                        <span className="font-bold text-stone-900">{item.coutTotal.toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>
                    <div className="w-full bg-stone-200/70 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${costPct}%` }}
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                        title={`${item.label} : ${item.coutTotal.toLocaleString('fr-FR')} €`}
                      />
                    </div>
                  </div>
                );
              })}

              {dimensionData.length === 0 && (
                <p className="text-xs text-stone-400 py-3 text-center">Aucune donnée disponible.</p>
              )}
            </div>
          </div>

          {/* Graph 2: Nombre de formations / participations */}
          <div className="p-4 rounded-xl bg-stone-50/60 border border-stone-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                <span>Nombre de formations & salariés formés</span>
              </h3>
              <span className="text-[11px] text-stone-400 font-medium">Participations</span>
            </div>

            <div className="space-y-3 pt-1">
              {dimensionData.map((item) => {
                const countPct = dimensionMaxNombre > 0 ? (item.nombreFormations / dimensionMaxNombre) * 100 : 0;
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 truncate">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-500">
                          {item.effectifForme}/{item.effectifTotal} formé(s) ({item.tauxAcces}%)
                        </span>
                        <span className="font-bold text-stone-900">{item.nombreFormations} session(s)</span>
                      </div>
                    </div>
                    <div className="w-full bg-stone-200/70 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${countPct}%` }}
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        title={`${item.label} : ${item.nombreFormations} participations`}
                      />
                    </div>
                  </div>
                );
              })}

              {dimensionData.length === 0 && (
                <p className="text-xs text-stone-400 py-3 text-center">Aucune donnée disponible.</p>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="overflow-x-auto rounded-lg border border-stone-200/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500">
              <tr>
                <th className="py-2.5 px-3 font-semibold">
                  {selectedDimension === 'statut' ? 'Statut collaborateur' : selectedDimension === 'sexe' ? 'Genre' : 'Service / Département'}
                </th>
                <th className="py-2.5 px-3 font-semibold text-center">Effectif total</th>
                <th className="py-2.5 px-3 font-semibold text-center">Salariés formés</th>
                <th className="py-2.5 px-3 font-semibold text-center">Taux d'accès</th>
                <th className="py-2.5 px-3 font-semibold text-center">Nb participations</th>
                <th className="py-2.5 px-3 font-semibold text-center">Heures suivies</th>
                <th className="py-2.5 px-3 font-semibold text-right text-emerald-800">Coût total (€)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Coût moyen / formé</th>
                <th className="py-2.5 px-3 font-semibold text-center">Part budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {dimensionData.map((row) => (
                <tr key={row.key} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-stone-900">
                    <span className="inline-flex items-center gap-1.5">
                      {selectedDimension === 'statut' && (
                        <span className="font-mono text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded border border-stone-200">
                          {row.key}
                        </span>
                      )}
                      <span>{row.label}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-stone-600">{row.effectifTotal}</td>
                  <td className="py-2.5 px-3 text-center font-medium text-stone-800">{row.effectifForme}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                      row.tauxAcces >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {row.tauxAcces}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-stone-700">{row.nombreFormations}</td>
                  <td className="py-2.5 px-3 text-center text-stone-600">{row.heuresFormation} h</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                    {row.coutTotal.toLocaleString('fr-FR')} €
                  </td>
                  <td className="py-2.5 px-3 text-right text-stone-700">
                    {row.coutMoyenParForme > 0 ? `${row.coutMoyenParForme.toLocaleString('fr-FR')} €` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center text-stone-500 font-medium">
                    {row.pctBudget}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Collaborator Training Passport */}
      <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-stone-600" />
              <span>Passeport Formation Individuel</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Historique des heures, formations obligatoires ou de développement des compétences
            </p>
          </div>

          {/* Search bar & Collaborator selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={passportSearch}
                onChange={(e) => {
                  setPassportSearch(e.target.value);
                  const q = e.target.value.toLowerCase().trim();
                  if (q) {
                    const matched = sortedCollaborateurs.find(
                      (c) =>
                        c.nom.toLowerCase().includes(q) ||
                        c.prenom.toLowerCase().includes(q) ||
                        c.matricule.toLowerCase().includes(q)
                    );
                    if (matched) setSelectedCollabId(matched.id);
                  }
                }}
                placeholder="Rechercher salarié..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-800 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
              />
            </div>

            <select
              id="select-collaborateur-history"
              value={selectedCollab?.id || ''}
              onChange={(e) => setSelectedCollabId(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 font-medium text-stone-800 focus:ring-1 focus:ring-stone-400 focus:outline-hidden max-w-xs truncate"
            >
              {filteredPassportCollaborateurs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom.toUpperCase()} {c.prenom} — {c.matricule} ({c.departement})
                </option>
              ))}
              {filteredPassportCollaborateurs.length === 0 && (
                <option value="" disabled>Aucun salarié trouvé</option>
              )}
            </select>
          </div>
        </div>

        {selectedCollab && collabHistory && (
          <div className="space-y-4">
            {/* Identity & Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-50/60 rounded-lg border border-stone-200/60">
              <div>
                <span className="text-[11px] text-stone-400">Collaborateur</span>
                <p className="text-xs font-semibold text-stone-900 mt-0.5">
                  {selectedCollab.nom.toUpperCase()} {selectedCollab.prenom}
                </p>
                <p className="text-[10px] text-stone-500">{selectedCollab.poste} • {selectedCollab.departement}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="font-mono text-[10px] bg-stone-200/80 text-stone-700 px-1.5 py-0.5 rounded">
                    {selectedCollab.matricule}
                  </span>
                  {selectedCollab.statut && (
                    <span 
                      title={STATUT_LABELS[selectedCollab.statut as CollaborateurStatut] || selectedCollab.statut}
                      className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.5 rounded cursor-help"
                    >
                      {selectedCollab.statut} • {STATUT_LABELS[selectedCollab.statut as CollaborateurStatut] || selectedCollab.statut}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-stone-400">Sessions suivies</span>
                <p className="text-base font-bold text-stone-900 mt-0.5">
                  {collabHistory.totalSessions} session(s)
                </p>
                <p className="text-[10px] text-stone-500">{collabHistory.totalJours} jours au total</p>
              </div>

              <div>
                <span className="text-[11px] text-stone-400">Volume horaire</span>
                <p className="text-base font-bold text-stone-900 mt-0.5">
                  {collabHistory.totalHeures} heures
                </p>
                <p className="text-[10px] text-stone-500">Temps de formation</p>
              </div>

              <div>
                <span className="text-[11px] text-stone-400">Budget alloué</span>
                <p className="text-base font-bold text-emerald-600 mt-0.5">
                  {collabHistory.totalBudgetIndividuel.toLocaleString('fr-FR')} €
                </p>
                <p className="text-[10px] text-stone-500">Coûts pédagogiques</p>
              </div>
            </div>

            {/* Badges de répartition des formations : Obligatoire vs Développement de compétence vs Autre */}
            <div className="p-3 bg-stone-50/40 rounded-lg border border-stone-200/50 flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-stone-500" />
                <span>Typologie des formations suivies :</span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70">
                <Shield className="h-3 w-3 text-amber-600" />
                <span><strong>{typeBreakdown.obligatoire}</strong> Obligatoire{typeBreakdown.obligatoire > 1 ? 's' : ''}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/70">
                <Sparkles className="h-3 w-3 text-indigo-600" />
                <span><strong>{typeBreakdown.devCompetence}</strong> Dév. de compétences</span>
              </span>

              {typeBreakdown.autre > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                  <span><strong>{typeBreakdown.autre}</strong> Autre</span>
                </span>
              )}
            </div>

            {/* Two Column Layout: Sessions vs Wishes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sessions list */}
              <div className="p-4 rounded-lg border border-stone-200/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-stone-500" />
                    <span>Sessions ({collabHistory.sessionsSuivies.length})</span>
                  </h3>
                  <span className="text-[11px] text-stone-400">Passées ou planifiées</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {collabHistory.sessionsSuivies.map((s) => {
                    const isOblig = (s.type || '').toLowerCase().includes('obligatoire') || (s.type || '').toLowerCase().includes('sécurité');
                    const isDev = (s.type || '').toLowerCase().includes('compétence') || (s.type || '').toLowerCase().includes('dév') || (s.type || '').toLowerCase().includes('métier') || (s.type || '').toLowerCase().includes('management') || (s.type || '').toLowerCase().includes('bureautique');

                    return (
                      <div
                        key={s.id}
                        onClick={() => onSelectSession(s)}
                        className="p-3 bg-white hover:bg-stone-50 border border-stone-200/60 rounded-lg cursor-pointer transition-colors text-xs space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-stone-900 truncate">{s.libelle}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                            s.statut === 'TERMINEE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                            s.statut === 'A_VENIR' ? 'bg-blue-50 text-blue-700 border border-blue-200/60' :
                            'bg-stone-100 text-stone-600'
                          }`}>
                            {s.statut === 'TERMINEE' ? 'Terminée' : s.statut === 'A_VENIR' ? 'À venir' : s.statut}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
                          <span>{s.organisme} • {s.dureeHeures}h</span>
                          
                          {/* Badge Type de formation */}
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                            isOblig ? 'bg-amber-100 text-amber-800' :
                            isDev ? 'bg-indigo-100 text-indigo-800' :
                            'bg-stone-100 text-stone-700'
                          }`}>
                            {isOblig ? 'Obligatoire' : isDev ? 'Dév. compétences' : s.type || 'Autre'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {collabHistory.sessionsSuivies.length === 0 && (
                    <p className="text-xs text-stone-400 py-4 text-center">
                      Aucune formation enregistrée.
                    </p>
                  )}
                </div>
              </div>

              {/* Expressed Wishes */}
              <div className="p-4 rounded-lg border border-stone-200/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-stone-500" />
                    <span>Souhaits exprimés ({collabHistory.souhaitsCollab.length})</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('souhaits')}
                    className="text-[11px] text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
                  >
                    Voir dans Souhaits →
                  </button>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {collabHistory.souhaitsCollab.map((sw) => (
                    <div
                      key={sw.id}
                      className="p-2.5 bg-white border border-stone-200/60 rounded-lg text-xs flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-stone-800 truncate">{sw.intituleSouhait}</p>
                        <p className="text-[11px] text-stone-400">{sw.domaine} • Source: {sw.source}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        sw.statut === 'REALISE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                        sw.statut === 'PLANIFIE' ? 'bg-blue-50 text-blue-700 border border-blue-200/60' :
                        'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}>
                        {sw.statut === 'REALISE' ? 'Réalisé' : sw.statut === 'PLANIFIE' ? 'Planifié' : 'En attente'}
                      </span>
                    </div>
                  ))}

                  {collabHistory.souhaitsCollab.length === 0 && (
                    <p className="text-xs text-stone-400 py-4 text-center">
                      Aucun souhait saisi pour ce collaborateur.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
