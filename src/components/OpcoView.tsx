import React, { useState } from 'react';
import { 
  Euro, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Plus, 
  Filter,
  Check,
  X,
  Edit3,
  Landmark
} from 'lucide-react';
import { FormationSession, OPCOStatus, SuiviOPCO } from '../types';
import { calculateOPCOStats } from '../utils/analytics';
import { exportOPCOReportToExcel } from '../utils/excelHelper';

interface OpcoViewProps {
  sessions: FormationSession[];
  onUpdateSession: (updated: FormationSession) => void;
  onSelectSession: (session: FormationSession) => void;
}

export const OpcoView: React.FC<OpcoViewProps> = ({
  sessions,
  onUpdateSession,
  onSelectSession
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OPCOStatus>('ALL');
  const [subrogationFilter, setSubrogationFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [editingSession, setEditingSession] = useState<FormationSession | null>(null);
  const [editForm, setEditForm] = useState<SuiviOPCO | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const opcoStats = calculateOPCOStats(sessions);

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    // Only display sessions that either have costs or are declared
    const hasCout = s.coutPedagogiqueTotal > 0 || (s.fraisAnnexesTotal || 0) > 0;
    if (!hasCout && !s.opco.declare) return false;

    if (statusFilter !== 'ALL' && s.opco.statut !== statusFilter) return false;

    if (subrogationFilter === 'YES' && (!s.opco.declare || !s.opco.subrogation)) return false;
    if (subrogationFilter === 'NO' && (!s.opco.declare || s.opco.subrogation)) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchLibelle = s.libelle.toLowerCase().includes(q);
      const matchOrganisme = s.organisme.toLowerCase().includes(q);
      const matchOpco = (s.opco.nomOpco || '').toLowerCase().includes(q);
      const matchDossier = (s.opco.numeroDossier || '').toLowerCase().includes(q);
      return matchLibelle || matchOrganisme || matchOpco || matchDossier;
    }

    return true;
  });

  const handleOpenEdit = (session: FormationSession) => {
    setEditingSession(session);
    setEditForm({
      ...session.opco,
      declare: session.opco.declare || true,
      nomOpco: session.opco.nomOpco || 'Atlas',
      numeroDossier: session.opco.numeroDossier || '',
      statut: session.opco.statut || 'EN_INSTRUCTION',
      montantPrisEnCharge: session.opco.montantPrisEnCharge ?? session.coutPedagogiqueTotal,
      fraisAnnexesPrisEnCharge: session.opco.fraisAnnexesPrisEnCharge ?? (session.fraisAnnexesTotal || 0),
      subrogation: session.opco.subrogation ?? true
    });
  };

  const handleSaveOpco = () => {
    if (!editingSession || !editForm) return;

    const updatedSession: FormationSession = {
      ...editingSession,
      opco: {
        ...editForm,
        declare: true
      }
    };

    onUpdateSession(updatedSession);
    setFeedbackMsg(`✓ Dossier OPCO mis à jour pour "${editingSession.libelle}".`);
    setTimeout(() => setFeedbackMsg(null), 4000);
    setEditingSession(null);
    setEditForm(null);
  };

  const getStatusBadge = (statut: OPCOStatus) => {
    switch (statut) {
      case 'ACCORDE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Accordé
          </span>
        );
      case 'REGLE_CLOTURE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">
            <Check className="h-3 w-3 text-blue-600" />
            Réglé & Clôturé
          </span>
        );
      case 'EN_INSTRUCTION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70">
            <Clock className="h-3 w-3 text-amber-600" />
            En instruction
          </span>
        );
      case 'EN_ATTENTE_REGLEMENT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/70">
            <Clock className="h-3 w-3 text-purple-600" />
            En attente règlement
          </span>
        );
      case 'REFUSE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200/70">
            <AlertCircle className="h-3 w-3 text-red-600" />
            Refusé
          </span>
        );
      case 'NON_DEPOSE':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200/60">
            Non déposé
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Suivi OPCO & Financements
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Dossiers de prise en charge, subrogation de paiement, versements et reste à charge employeur
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportOPCOReportToExcel(sessions)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Exporter les dossiers OPCO au format Excel"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel OPCO</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 4 Clean Minimalist KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Pris en charge */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Financement Accordé OPCO</span>
              <Euro className="h-4 w-4 text-stone-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-stone-900">
                {opcoStats.totalPrisEnChargeOPCO.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Taux de couverture</span>
            <span className="font-semibold text-emerald-700">{opcoStats.tauxCouvertureGlobal}% du budget</span>
          </div>
        </div>

        {/* KPI 2: Reste à charge */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Reste à Charge Net</span>
              <Landmark className="h-4 w-4 text-stone-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-stone-900">
                {opcoStats.resteAChargeEntreprise.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Budget global engagé</span>
            <span className="font-medium text-stone-700">{opcoStats.totalBudgetFormations.toLocaleString('fr-FR')} € HT</span>
          </div>
        </div>

        {/* KPI 3: Subrogation */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Paiement Subrogé</span>
              <FileText className="h-4 w-4 text-stone-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-stone-900">
                {opcoStats.montantAvecSubrogation.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Remboursement direct</span>
            <span className="font-medium text-stone-700">{opcoStats.montantSansSubrogation.toLocaleString('fr-FR')} €</span>
          </div>
        </div>

        {/* KPI 4: Dossiers déclarés */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Dossiers Déposés</span>
              <CheckCircle2 className="h-4 w-4 text-stone-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-stone-900">
                {sessions.filter((s) => s.opco.declare).length}
              </span>
              <span className="text-xs text-stone-500">
                / {sessions.length} formations
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Dossiers accordés</span>
            <span className="font-semibold text-stone-800">
              {sessions.filter((s) => s.opco.statut === 'ACCORDE' || s.opco.statut === 'REGLE_CLOTURE').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher formation, OPCO, n° dossier..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-700 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          >
            <option value="ALL">Tous les statuts OPCO</option>
            <option value="ACCORDE">Accordé</option>
            <option value="EN_INSTRUCTION">En instruction</option>
            <option value="REGLE_CLOTURE">Réglé & Clôturé</option>
            <option value="EN_ATTENTE_REGLEMENT">En attente de règlement</option>
            <option value="NON_DEPOSE">Non déposé</option>
            <option value="REFUSE">Refusé</option>
          </select>

          <select
            value={subrogationFilter}
            onChange={(e) => setSubrogationFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-700 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          >
            <option value="ALL">Tous modes de règlement</option>
            <option value="YES">Avec subrogation (direct)</option>
            <option value="NO">Sans subrogation (remboursement)</option>
          </select>
        </div>
      </div>

      {/* Dossiers List */}
      <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden shadow-2xs divide-y divide-stone-100">
        {filteredSessions.map((session) => {
          const totalCout = session.coutPedagogiqueTotal + (session.fraisAnnexesTotal || 0);
          const prisEnCharge = session.opco.montantPrisEnCharge + (session.opco.fraisAnnexesPrisEnCharge || 0);
          const resteACharge = Math.max(0, totalCout - prisEnCharge);

          return (
            <div
              key={session.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/70 transition-colors text-xs"
            >
              {/* Session & OPCO Details */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(session.opco.statut)}

                  {session.opco.declare && (
                    <span className="font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                      OPCO : {session.opco.nomOpco || 'Non précisé'}
                    </span>
                  )}

                  {session.opco.numeroDossier && (
                    <span className="font-mono text-[11px] text-stone-500 bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded">
                      Dossier : #{session.opco.numeroDossier}
                    </span>
                  )}

                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    session.opco.subrogation 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/70' 
                      : 'bg-stone-100 text-stone-600 border border-stone-200/60'
                  }`}>
                    {session.opco.subrogation ? 'Subrogation de paiement' : 'Remboursement employeur'}
                  </span>
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
                  {session.opco.dateDeclaration && (
                    <span>Déposé le : {session.opco.dateDeclaration}</span>
                  )}
                  {session.opco.commentaires && (
                    <span className="italic text-stone-400 truncate max-w-xs">« {session.opco.commentaires} »</span>
                  )}
                </div>
              </div>

              {/* Financial Column & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 shrink-0">
                <div className="text-right space-y-0.5">
                  <div className="text-stone-500 text-[11px]">
                    Coût total : <strong className="text-stone-700">{totalCout.toLocaleString('fr-FR')} € HT</strong>
                  </div>
                  <div className="text-xs font-semibold text-emerald-700">
                    Prise en charge : {prisEnCharge.toLocaleString('fr-FR')} €
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Reste à charge : <span className="font-medium text-stone-600">{resteACharge.toLocaleString('fr-FR')} €</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(session)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Mettre à jour le dossier OPCO"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-stone-500" />
                    <span>Modifier</span>
                  </button>

                  <button
                    onClick={() => onSelectSession(session)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
                    title="Voir la session complète"
                  >
                    <span>Détails</span>
                    <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <Euro className="h-8 w-8 text-stone-300 mx-auto" />
            <p className="text-sm font-medium text-stone-600">Aucun dossier OPCO ne correspond aux filtres.</p>
            <p className="text-xs text-stone-400">Modifiez votre recherche ou mettez à jour une session de formation.</p>
          </div>
        )}
      </div>

      {/* Edit OPCO Dossier Modal */}
      {editingSession && editForm && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-stone-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Gestion du Dossier OPCO
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 truncate max-w-sm">
                  {editingSession.libelle}
                </p>
              </div>
              <button
                onClick={() => { setEditingSession(null); setEditForm(null); }}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Nom de l'OPCO</label>
                  <input
                    type="text"
                    value={editForm.nomOpco}
                    onChange={(e) => setEditForm({ ...editForm, nomOpco: e.target.value })}
                    placeholder="Ex: Atlas, Akto, Constructys..."
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Numéro de dossier</label>
                  <input
                    type="text"
                    value={editForm.numeroDossier}
                    onChange={(e) => setEditForm({ ...editForm, numeroDossier: e.target.value })}
                    placeholder="Ex: OPCO-2024-8742"
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Statut du dossier</label>
                  <select
                    value={editForm.statut}
                    onChange={(e) => setEditForm({ ...editForm, statut: e.target.value as OPCOStatus })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
                  >
                    <option value="NON_DEPOSE">Non déposé</option>
                    <option value="EN_INSTRUCTION">En instruction</option>
                    <option value="ACCORDE">Accordé</option>
                    <option value="EN_ATTENTE_REGLEMENT">En attente de règlement</option>
                    <option value="REGLE_CLOTURE">Réglé & Clôturé</option>
                    <option value="REFUSE">Refusé</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Date de dépôt / accord</label>
                  <input
                    type="date"
                    value={editForm.dateDeclaration || ''}
                    onChange={(e) => setEditForm({ ...editForm, dateDeclaration: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Prise en charge Pédagogique (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.montantPrisEnCharge}
                    onChange={(e) => setEditForm({ ...editForm, montantPrisEnCharge: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Prise en charge Frais Annexes (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.fraisAnnexesPrisEnCharge}
                    onChange={(e) => setEditForm({ ...editForm, fraisAnnexesPrisEnCharge: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.subrogation}
                    onChange={(e) => setEditForm({ ...editForm, subrogation: e.target.checked })}
                    className="rounded border-stone-300 text-stone-900"
                  />
                  <span className="font-medium text-stone-800">
                    Subrogation de paiement (Règlement direct à l'organisme formateur)
                  </span>
                </label>
                <p className="text-[11px] text-stone-400 mt-1 pl-5">
                  Si non coché, l'entreprise avance les frais et est remboursée ultérieurement par l'OPCO.
                </p>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Commentaires / Suivi</label>
                <textarea
                  rows={2}
                  value={editForm.commentaires || ''}
                  onChange={(e) => setEditForm({ ...editForm, commentaires: e.target.value })}
                  placeholder="Notes de relance, justificatifs transmis, interlocuteur OPCO..."
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => { setEditingSession(null); setEditForm(null); }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-800 bg-white border border-stone-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveOpco}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 shadow-2xs transition-colors cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Enregistrer le dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
