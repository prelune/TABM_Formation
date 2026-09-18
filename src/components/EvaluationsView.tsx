import React, { useState, useRef, useMemo } from 'react';
import { 
  Star, 
  Clock, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Send, 
  Users, 
  FileText, 
  Search, 
  ExternalLink, 
  ThumbsUp, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Building2, 
  Award, 
  BarChart3, 
  TrendingUp, 
  SlidersHorizontal,
  GraduationCap
} from 'lucide-react';
import { FormationSession, Collaborateur } from '../types';
import { calculateColdEvaluationAlerts } from '../utils/analytics';
import { exportEvaluationsToExcel, importEvaluationsFromExcel } from '../utils/excelHelper';

interface EvaluationsViewProps {
  sessions: FormationSession[];
  collaborateurs: Collaborateur[];
  onUpdateSession: (updated: FormationSession) => void;
  onSelectSession: (session: FormationSession) => void;
  onUpdateSessions?: (sessions: FormationSession[]) => void;
}

export const EvaluationsView: React.FC<EvaluationsViewProps> = ({
  sessions,
  collaborateurs,
  onUpdateSession,
  onSelectSession,
  onUpdateSessions
}) => {
  const [viewMode, setViewMode] = useState<'SESSIONS' | 'PEDAGOGIE_ORGANISMES'>('SESSIONS');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'COLD_PENDING' | 'HOT_PENDING' | 'COMPLETED'>('ALL');
  const [organismeSearch, setOrganismeSearch] = useState('');
  const [organismeSortBy, setOrganismeSortBy] = useState<'PEDAGOGIE_DESC' | 'NOTE_GLOBALE_DESC' | 'SESSIONS_DESC' | 'NOM_ASC'>('PEDAGOGIE_DESC');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email modal copy states
  const [mailModalSession, setMailModalSession] = useState<FormationSession | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [mailSentSuccess, setMailSentSuccess] = useState<string | null>(null);

  const handleCopy = (text: string, type: 'subject' | 'body') => {
    navigator.clipboard.writeText(text);
    if (type === 'subject') {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2500);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateSessions) return;
    setIsImporting(true);
    setImportFeedback(null);
    try {
      const res = await importEvaluationsFromExcel(file, sessions);
      onUpdateSessions(res.updatedSessions);
      setImportFeedback(`Évaluations synchronisées avec succès : ${res.updatedCount} session(s) mise(s) à jour.`);
      setTimeout(() => setImportFeedback(null), 5000);
    } catch (err: any) {
      setImportFeedback('Erreur lors de l\'import des évaluations : ' + (err?.message || 'fichier invalide'));
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const pastSessions = sessions.filter((s) => s.statut === 'TERMINEE');
  const coldAlerts = calculateColdEvaluationAlerts(sessions);

  // Group & analyze pedagogy and complementary evaluations by training organization (organisme)
  const organismeAnalytics = useMemo(() => {
    const map = new Map<string, {
      nom: string;
      sessions: FormationSession[];
      sessionsEvaluees: number;
      sommePedagogie: number;
      countPedagogie: number;
      sommeContenu: number;
      countContenu: number;
      sommeOrganisation: number;
      countOrganisation: number;
      sommeGlobale: number;
      countGlobale: number;
      sommeRecommandation: number;
      countRecommandation: number;
    }>();

    sessions.forEach((s) => {
      const orgName = (s.organisme || 'Organisme non renseigné').trim();
      if (!map.has(orgName)) {
        map.set(orgName, {
          nom: orgName,
          sessions: [],
          sessionsEvaluees: 0,
          sommePedagogie: 0,
          countPedagogie: 0,
          sommeContenu: 0,
          countContenu: 0,
          sommeOrganisation: 0,
          countOrganisation: 0,
          sommeGlobale: 0,
          countGlobale: 0,
          sommeRecommandation: 0,
          countRecommandation: 0
        });
      }

      const item = map.get(orgName)!;
      item.sessions.push(s);

      const ec = s.evaluationChaud;
      if (ec && (ec.effectuee || ec.noteGlobale > 0 || (ec.noteFormateur && ec.noteFormateur > 0))) {
        item.sessionsEvaluees += 1;

        if (ec.noteFormateur && ec.noteFormateur > 0) {
          item.sommePedagogie += ec.noteFormateur;
          item.countPedagogie += 1;
        } else if (ec.noteGlobale > 0) {
          // Fallback if only global note was initially recorded
          item.sommePedagogie += ec.noteGlobale;
          item.countPedagogie += 1;
        }

        if (ec.noteContenu && ec.noteContenu > 0) {
          item.sommeContenu += ec.noteContenu;
          item.countContenu += 1;
        }

        if (ec.noteOrganisation && ec.noteOrganisation > 0) {
          item.sommeOrganisation += ec.noteOrganisation;
          item.countOrganisation += 1;
        }

        if (ec.noteGlobale && ec.noteGlobale > 0) {
          item.sommeGlobale += ec.noteGlobale;
          item.countGlobale += 1;
        }

        if (ec.tauxRecommandation && ec.tauxRecommandation > 0) {
          item.sommeRecommandation += ec.tauxRecommandation;
          item.countRecommandation += 1;
        }
      }
    });

    const list = Array.from(map.values()).map((org) => {
      const avgPedagogie = org.countPedagogie > 0
        ? Math.round((org.sommePedagogie / org.countPedagogie) * 10) / 10
        : 0;
      const avgContenu = org.countContenu > 0
        ? Math.round((org.sommeContenu / org.countContenu) * 10) / 10
        : 0;
      const avgOrganisation = org.countOrganisation > 0
        ? Math.round((org.sommeOrganisation / org.countOrganisation) * 10) / 10
        : 0;
      const avgGlobale = org.countGlobale > 0
        ? Math.round((org.sommeGlobale / org.countGlobale) * 10) / 10
        : 0;
      const avgRecommandation = org.countRecommandation > 0
        ? Math.round(org.sommeRecommandation / org.countRecommandation)
        : (avgGlobale > 0 ? Math.round((avgGlobale / 5) * 100) : 0);

      return {
        nom: org.nom,
        totalSessions: org.sessions.length,
        sessionsEvaluees: org.sessionsEvaluees,
        sessions: org.sessions,
        avgPedagogie,
        avgContenu,
        avgOrganisation,
        avgGlobale,
        avgRecommandation
      };
    });

    // Filter by search
    const filtered = list.filter((org) =>
      !organismeSearch.trim() || org.nom.toLowerCase().includes(organismeSearch.toLowerCase().trim())
    );

    // Sort
    filtered.sort((a, b) => {
      if (organismeSortBy === 'PEDAGOGIE_DESC') {
        return b.avgPedagogie - a.avgPedagogie || b.avgGlobale - a.avgGlobale;
      }
      if (organismeSortBy === 'NOTE_GLOBALE_DESC') {
        return b.avgGlobale - a.avgGlobale || b.avgPedagogie - a.avgPedagogie;
      }
      if (organismeSortBy === 'SESSIONS_DESC') {
        return b.totalSessions - a.totalSessions;
      }
      return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
    });

    return filtered;
  }, [sessions, organismeSearch, organismeSortBy]);

  const filteredSessions = pastSessions.filter((session) => {
    const isColdPending =
      session.evaluationFroid.requise && !session.evaluationFroid.effectuee;
    const isHotPending = !session.evaluationChaud.effectuee;
    const isFullyCompleted =
      session.evaluationChaud.effectuee &&
      (!session.evaluationFroid.requise || session.evaluationFroid.effectuee);

    if (filterType === 'COLD_PENDING' && !isColdPending) return false;
    if (filterType === 'HOT_PENDING' && !isHotPending) return false;
    if (filterType === 'COMPLETED' && !isFullyCompleted) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        session.libelle.toLowerCase().includes(q) ||
        session.organisme.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const handleSendReminderEmail = (session: FormationSession) => {
    setMailSentSuccess(
      `Le rappel par e-mail pour "${session.libelle}" a été généré et adressé aux gestionnaires de la formation avec succès.`
    );
    setMailModalSession(null);
    setTimeout(() => setMailSentSuccess(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Open-Air Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Évaluations & ROI
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {pastSessions.length} session(s) terminée(s) • Mesure de la satisfaction à chaud et du transfert à froid à 3 mois
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportEvaluationsToExcel(sessions)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Exporter les évaluations au format Excel"
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
                title="Réimporter vos notes et commentaires"
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

      {mailSentSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{mailSentSuccess}</span>
        </div>
      )}

      {/* Main Tab Switcher: Sessions vs Analyse Pédagogie par Organisme */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setViewMode('SESSIONS')}
          className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            viewMode === 'SESSIONS'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Star className="h-4 w-4 text-amber-500" />
          <span>Sessions & Évaluations ({pastSessions.length})</span>
        </button>

        <button
          onClick={() => setViewMode('PEDAGOGIE_ORGANISMES')}
          className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            viewMode === 'PEDAGOGIE_ORGANISMES'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <GraduationCap className="h-4 w-4 text-emerald-600" />
          <span>Analyse Pédagogie par Organisme ({organismeAnalytics.length})</span>
        </button>
      </div>

      {viewMode === 'PEDAGOGIE_ORGANISMES' ? (
        /* VUE ANALYSE PEDAGOGIE PAR ORGANISME */
        <div className="space-y-6">
          {/* Top KPI Cards for Pedagogy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
              <span className="text-xs font-medium text-stone-500">Organismes référencés</span>
              <p className="text-2xl font-bold tracking-tight text-stone-900 mt-2">
                {organismeAnalytics.length}
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                Sur {pastSessions.length} session(s) terminée(s)
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
              <span className="text-xs font-medium text-stone-500">Moyenne Pédagogie globale</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-emerald-700">
                  {organismeAnalytics.length > 0
                    ? (organismeAnalytics.reduce((acc, o) => acc + o.avgPedagogie, 0) / organismeAnalytics.filter(o => o.avgPedagogie > 0).length || 0).toFixed(1)
                    : '—'}
                </span>
                <span className="text-xs font-semibold text-stone-400">/ 5</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Pédagogie et animation formateur
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
              <span className="text-xs font-medium text-stone-500">Meilleure note Pédagogie</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-stone-900">
                  {organismeAnalytics[0]?.avgPedagogie > 0 ? `${organismeAnalytics[0].avgPedagogie.toFixed(1)} / 5` : '—'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium truncate mt-1">
                {organismeAnalytics[0]?.nom || 'Aucun'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
              <span className="text-xs font-medium text-stone-500">Satisfaction générale</span>
              <p className="text-2xl font-bold tracking-tight text-stone-900 mt-2">
                {organismeAnalytics.length > 0
                  ? Math.round(organismeAnalytics.reduce((acc, o) => acc + o.avgRecommandation, 0) / organismeAnalytics.length)
                  : 0} %
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                Taux de recommandation moyen
              </p>
            </div>
          </div>

          {/* Search and Sort Toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 text-xs items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={organismeSearch}
                onChange={(e) => setOrganismeSearch(e.target.value)}
                placeholder="Rechercher un organisme..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-800 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-stone-500 text-xs shrink-0">Trier par :</span>
              <select
                value={organismeSortBy}
                onChange={(e) => setOrganismeSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-700 font-medium focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
              >
                <option value="PEDAGOGIE_DESC">Note Pédagogie (décroissante)</option>
                <option value="NOTE_GLOBALE_DESC">Note Globale (décroissante)</option>
                <option value="SESSIONS_DESC">Volume de sessions</option>
                <option value="NOM_ASC">Nom organisme (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Visual Comparative Bars for Pedagogy Ratings */}
          <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  <span>Comparatif des notes de pédagogie formateur</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Évaluation sur 5 étoiles de l'animation pédagogique et de la maîtrise du formateur
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {organismeAnalytics.map((org) => {
                const ped = org.avgPedagogie || org.avgGlobale;
                const pct = Math.min(100, Math.max(0, (ped / 5) * 100));
                const badgeColor = ped >= 4.5 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : ped >= 4.0 
                  ? 'bg-blue-50 text-blue-800 border-blue-200' 
                  : ped >= 3.0 
                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                  : 'bg-red-50 text-red-800 border-red-200';

                return (
                  <div key={org.nom} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="font-semibold text-stone-900 truncate">{org.nom}</span>
                        <span className="text-[11px] text-stone-400">({org.totalSessions} session(s))</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {ped >= 4.5 ? 'Excellente pédagogie' : ped >= 4.0 ? 'Très bonne' : ped >= 3.0 ? 'Conforme' : 'À surveiller'}
                        </span>
                        <span className="font-bold text-stone-900 text-xs w-12 text-right">
                          {ped > 0 ? `${ped.toFixed(1)} / 5` : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200/50">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          ped >= 4.5 ? 'bg-emerald-600' : ped >= 4.0 ? 'bg-blue-600' : ped >= 3.0 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}

              {organismeAnalytics.length === 0 && (
                <p className="text-xs text-stone-400 py-6 text-center">
                  Aucun organisme trouvé.
                </p>
              )}
            </div>
          </div>

          {/* Complete Synthesis Table by Organization */}
          <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900">
                Tableau détaillé des évaluations par organisme
              </h3>
              <span className="text-xs text-stone-400">
                Moyennes calculées sur les évaluations à chaud
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200/70 text-stone-500">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Organisme de formation</th>
                    <th className="py-3 px-3 font-semibold text-center">Sessions</th>
                    <th className="py-3 px-3 font-semibold text-center text-emerald-800 bg-emerald-50/60">
                      Pédagogie formateur
                    </th>
                    <th className="py-3 px-3 font-semibold text-center">Contenu & Programme</th>
                    <th className="py-3 px-3 font-semibold text-center">Logistique</th>
                    <th className="py-3 px-3 font-semibold text-center font-bold text-stone-900">
                      Note Globale (Moyenne)
                    </th>
                    <th className="py-3 px-3 font-semibold text-center">Recommandation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {organismeAnalytics.map((org) => (
                    <tr key={org.nom} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-stone-400" />
                          <span>{org.nom}</span>
                        </div>
                        <p className="text-[11px] text-stone-400 pl-5.5">
                          {org.sessionsEvaluees}/{org.totalSessions} session(s) évaluée(s)
                        </p>
                      </td>

                      <td className="py-3.5 px-3 text-center font-semibold text-stone-700">
                        {org.totalSessions}
                      </td>

                      <td className="py-3.5 px-3 text-center bg-emerald-50/40">
                        <div className="inline-flex items-center gap-1 font-bold text-emerald-800 text-sm">
                          <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                          <span>{org.avgPedagogie > 0 ? `${org.avgPedagogie.toFixed(1)} / 5` : '—'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center text-stone-700 font-medium">
                        {org.avgContenu > 0 ? `${org.avgContenu.toFixed(1)} / 5` : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-center text-stone-700 font-medium">
                        {org.avgOrganisation > 0 ? `${org.avgOrganisation.toFixed(1)} / 5` : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md font-bold text-stone-900 bg-stone-100 border border-stone-200 text-xs">
                          {org.avgGlobale > 0 ? `${org.avgGlobale.toFixed(1)} / 5` : '—'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-semibold text-stone-700">
                        {org.avgRecommandation > 0 ? `${org.avgRecommandation}%` : '—'}
                      </td>
                    </tr>
                  ))}

                  {organismeAnalytics.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        Aucun organisme de formation trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* VUE SESSIONS CLASSIQUE */
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer une session terminée..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-800 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
              />
            </div>

            <div className="sm:w-80">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-700 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
              >
                <option value="ALL">Toutes les sessions ({pastSessions.length})</option>
                <option value="COLD_PENDING">Évaluation à froid due (+3 mois) ({coldAlerts.length})</option>
                <option value="HOT_PENDING">Évaluation à chaud en attente</option>
                <option value="COMPLETED">Évaluations 100% complètes</option>
              </select>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const isColdDue = session.evaluationFroid.requise && !session.evaluationFroid.effectuee;
              const hotDone = session.evaluationChaud.effectuee;
              const coldDone = session.evaluationFroid.effectuee;

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
                >
                  {/* Header of session card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {session.type}
                        </span>
                        <span className="text-xs text-slate-500">• {session.organisme}</span>
                        <span className="text-xs text-slate-400">
                          Terminée le {session.dateFin}
                        </span>
                      </div>
                      <h3
                        onClick={() => onSelectSession(session)}
                        className="text-base font-bold text-slate-900 mt-1 hover:text-indigo-600 cursor-pointer"
                      >
                        {session.libelle}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isColdDue && (
                        <button
                          onClick={() => setMailModalSession(session)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Rappel mail manager (+3m)</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectSession(session)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs cursor-pointer"
                      >
                        Saisir / Modifier notes
                      </button>
                    </div>
                  </div>

                  {/* Two columns: Évaluation à chaud vs Évaluation à froid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    {/* Hot Evaluation (À Chaud) */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span>Évaluation à Chaud (Fin de stage)</span>
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hotDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {hotDone ? 'Effectuée' : 'À saisir'}
                        </span>
                      </div>

                      {hotDone ? (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-slate-900">
                                {session.evaluationChaud.noteGlobale}
                              </span>
                              <span className="text-slate-400 font-semibold">/ 5</span>
                              <span className="text-[10px] text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded font-medium ml-1">
                                Moyenne calculée
                              </span>
                            </div>

                            <span className="text-[11px] text-emerald-700 font-medium">
                              Taux reco : {session.evaluationChaud.tauxRecommandation || 90}%
                            </span>
                          </div>

                          {/* Detail of 3 sub-notes */}
                          <div className="grid grid-cols-3 gap-1.5 py-1 px-2 bg-white rounded-lg border border-slate-200/70 text-[11px]">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Contenu</span>
                              <span className="font-bold text-slate-800">
                                {session.evaluationChaud.noteContenu ? `${session.evaluationChaud.noteContenu}/5` : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-emerald-700 font-medium block text-[10px]">Pédagogie</span>
                              <span className="font-bold text-emerald-800">
                                {session.evaluationChaud.noteFormateur ? `${session.evaluationChaud.noteFormateur}/5` : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Logistique</span>
                              <span className="font-bold text-slate-800">
                                {session.evaluationChaud.noteOrganisation ? `${session.evaluationChaud.noteOrganisation}/5` : '—'}
                              </span>
                            </div>
                          </div>

                          {session.evaluationChaud.pointsForts && (
                            <p className="text-[11px] text-slate-600">
                              <strong className="text-slate-800">Points forts :</strong> {session.evaluationChaud.pointsForts}
                            </p>
                          )}
                          {session.evaluationChaud.axesAmelioration && (
                            <p className="text-[11px] text-slate-600">
                              <strong className="text-slate-800">Axes d'amélioration :</strong> {session.evaluationChaud.axesAmelioration}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 pt-1">
                          Saisissez les notes de contenu, pédagogie et organisation : la note globale sera calculée automatiquement.
                        </p>
                      )}
                    </div>

                    {/* Cold Evaluation (À Froid - 3 mois) */}
                    <div className={`p-4 rounded-xl border space-y-2 text-xs ${
                      isColdDue
                        ? 'bg-indigo-50/60 border-indigo-200'
                        : coldDone
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-slate-50/50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-indigo-600" />
                          <span>Évaluation à Froid (+3 mois)</span>
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          coldDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : isColdDue
                            ? 'bg-indigo-100 text-indigo-800 font-extrabold animate-pulse'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {coldDone ? '✓ Réalisée' : isColdDue ? 'Rappel échu (+3m)' : 'Prévue'}
                        </span>
                      </div>

                      {coldDone ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-indigo-700">
                              {session.evaluationFroid.miseEnPratiqueNote}
                            </span>
                            <span className="text-slate-400 font-semibold">/ 5</span>
                            <span className="text-[11px] text-slate-500 ml-2">
                              Mise en application au poste
                            </span>
                          </div>

                          {session.evaluationFroid.commentairesManager && (
                            <p className="text-[11px] text-slate-600 italic">
                              "{session.evaluationFroid.commentairesManager}"
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400">
                            Évalué par le manager le {session.evaluationFroid.dateRealisation}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[11px] text-slate-600">
                            Échéance théorique : <strong>{session.evaluationFroid.datePrevue || '3 mois après la fin'}</strong>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Un questionnaire doit être transmis au manager pour constater l'impact opérationnel et les résultats réels.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredSessions.length === 0 && (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <Star className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">Aucune évaluation correspondante</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Les évaluations apparaissent une fois les sessions passées en statut "Terminée".
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reminder Email Modal (Object + Body to copy-paste into pro email) */}
      {mailModalSession && (() => {
        const mailSubject = `[Rappel Formation RH] Évaluation d'efficacité à froid (3 mois) - ${mailModalSession.libelle}`;
        const mailBody = `Bonjour,

La session de formation « ${mailModalSession.libelle} » s'est achevée le ${mailModalSession.dateFin} (il y a maintenant 3 mois).

Conformément à notre démarche qualité et au plan de développement des compétences, nous vous invitons à évaluer le transfert des acquis au poste de travail pour vos collaborateurs formés (${mailModalSession.participants.length} salarié(s)).

Merci de nous faire part de vos retours d'impact ou de compléter l'évaluation à froid dans l'outil RH.

Bien cordialement,
Le Service Formation & Ressources Humaines`;

        return (
          <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-stone-200/90 p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-stone-700" />
                  <h3 className="text-sm font-semibold text-stone-900">
                    Modèle de mail de relance manager
                  </h3>
                </div>
                <button
                  onClick={() => setMailModalSession(null)}
                  className="text-stone-400 hover:text-stone-600 p-1 rounded-md"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-stone-500">
                Copiez l'objet et le texte ci-dessous pour les coller directement dans votre messagerie professionnelle.
              </p>

              {/* Objet Field with Copy Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-stone-700">Objet du mail :</label>
                  <button
                    onClick={() => handleCopy(mailSubject, 'subject')}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70 px-2 py-1 rounded transition-colors cursor-pointer"
                  >
                    {copiedSubject ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700">Objet copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-stone-500" />
                        <span>Copier l'objet</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-medium select-all">
                  {mailSubject}
                </div>
              </div>

              {/* Corps du message Field with Copy Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-stone-700">Texte du message :</label>
                  <button
                    onClick={() => handleCopy(mailBody, 'body')}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70 px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    {copiedBody ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700">Texte copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-stone-500" />
                        <span>Copier le texte</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 whitespace-pre-wrap font-sans text-xs leading-relaxed select-all">
                  {mailBody}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setMailModalSession(null)}
                  className="px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-medium text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
