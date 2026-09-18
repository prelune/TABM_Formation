import React, { useState, useRef, useMemo } from 'react';
import { 
  Users, 
  Upload, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Mail, 
  Calendar, 
  Award, 
  Sparkles, 
  ChevronRight, 
  X,
  FileSpreadsheet,
  Edit2,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag
} from 'lucide-react';
import { Collaborateur, FormationSession, SouhaitFormation, CollaborateurStatut, STATUT_LABELS } from '../types';
import { downloadCollaborateursTemplate, exportCurrentCollaborateursToExcel, importCollaborateursFromExcel } from '../utils/excelHelper';
import { getCollaborateurHistory } from '../utils/analytics';

interface CollaborateursViewProps {
  collaborateurs: Collaborateur[];
  sessions: FormationSession[];
  souhaits: SouhaitFormation[];
  onAddCollaborateur: (newCollab: Collaborateur) => void;
  onUpdateCollaborateur: (updated: Collaborateur) => void;
  onImportCollaborateurs: (imported: Omit<Collaborateur, 'id'>[]) => void;
  onSelectSession: (session: FormationSession) => void;
  onUpdateCollaborateursList?: (collabs: Collaborateur[]) => void;
}

type SortColumn = 'nom' | 'matricule' | 'genre' | 'statut' | 'poste' | 'formations' | 'souhaits';

export const CollaborateursView: React.FC<CollaborateursViewProps> = ({
  collaborateurs,
  sessions,
  souhaits,
  onAddCollaborateur,
  onUpdateCollaborateur,
  onImportCollaborateurs,
  onSelectSession,
  onUpdateCollaborateursList
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'F' | 'H'>('ALL');
  const [statutFilter, setStatutFilter] = useState<string>('ALL');

  // Column sorting state - default alphabetical by last name (nom de famille)
  const [sortColumn, setSortColumn] = useState<SortColumn>('nom');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaborateur | null>(null);
  const [selectedPassportCollab, setSelectedPassportCollab] = useState<Collaborateur | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Departments
  const departments = Array.from(new Set(collaborateurs.map((c) => c.departement))).sort();

  // Excel upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      if (onUpdateCollaborateursList) {
        const res = await importCollaborateursFromExcel(file, collaborateurs);
        onUpdateCollaborateursList(res.updatedCollaborateurs);
        setUploadSuccessMsg(`Import réussi : ${res.updatedCount} collaborateur(s) mis à jour, ${res.createdCount} nouveau(x) créé(s).`);
      } else {
        const parsed = await importCollaborateursFromExcel(file, collaborateurs);
        onImportCollaborateurs(parsed.updatedCollaborateurs);
        setUploadSuccessMsg(`${parsed.updatedCollaborateurs.length} collaborateurs importés avec succès.`);
      }
      setTimeout(() => setUploadSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Erreur lors de la lecture du fichier Excel des collaborateurs : ' + (err?.message || 'format invalide'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle or change sort column
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Pre-calculate collaborator metrics for quick sorting
  const collabMetricsMap = useMemo(() => {
    const map = new Map<string, { sessionsCount: number; souhaitsCount: number }>();
    collaborateurs.forEach((c) => {
      const h = getCollaborateurHistory(c.id, sessions, souhaits);
      map.set(c.id, {
        sessionsCount: h.totalSessions,
        souhaitsCount: h.souhaitsCollab.length
      });
    });
    return map;
  }, [collaborateurs, sessions, souhaits]);

  // Filtered & Sorted Collaborators
  const filtered = useMemo(() => {
    const filteredList = collaborateurs.filter((c) => {
      if (deptFilter !== 'ALL' && c.departement !== deptFilter) return false;
      if (genderFilter !== 'ALL' && c.genre !== genderFilter) return false;
      if (statutFilter !== 'ALL' && c.statut !== statutFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          c.nom.toLowerCase().includes(q) ||
          c.prenom.toLowerCase().includes(q) ||
          c.matricule.toLowerCase().includes(q) ||
          (c.statut && c.statut.toLowerCase().includes(q)) ||
          c.poste.toLowerCase().includes(q) ||
          c.departement.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return filteredList.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'nom':
          // Strictly sort by last name (nom de famille), then first name
          comparison = a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }) || 
                       a.prenom.localeCompare(b.prenom, 'fr');
          break;
        case 'matricule':
          comparison = a.matricule.localeCompare(b.matricule, 'fr', { numeric: true });
          break;
        case 'genre':
          comparison = (a.genre || '').localeCompare(b.genre || '');
          break;
        case 'statut':
          comparison = (a.statut || '').localeCompare(b.statut || '');
          break;
        case 'poste':
          comparison = a.poste.localeCompare(b.poste, 'fr') || a.departement.localeCompare(b.departement, 'fr');
          break;
        case 'formations': {
          const countA = collabMetricsMap.get(a.id)?.sessionsCount || 0;
          const countB = collabMetricsMap.get(b.id)?.sessionsCount || 0;
          comparison = countA - countB;
          break;
        }
        case 'souhaits': {
          const countA = collabMetricsMap.get(a.id)?.souhaitsCount || 0;
          const countB = collabMetricsMap.get(b.id)?.souhaitsCount || 0;
          comparison = countA - countB;
          break;
        }
        default:
          comparison = a.nom.localeCompare(b.nom, 'fr');
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [collaborateurs, deptFilter, genderFilter, statutFilter, searchTerm, sortColumn, sortDirection, collabMetricsMap]);

  // Modal form states
  const [formNom, setFormNom] = useState('');
  const [formPrenom, setFormPrenom] = useState('');
  const [formMatricule, setFormMatricule] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGenre, setFormGenre] = useState<'F' | 'H' | 'Autre'>('F');
  const [formStatut, setFormStatut] = useState<CollaborateurStatut>('EMP');
  const [formDept, setFormDept] = useState('Informatique & Tech');
  const [formPoste, setFormPoste] = useState('');
  const [formDateEntree, setFormDateEntree] = useState(new Date().toISOString().slice(0, 10));

  const openAdd = () => {
    setEditingCollab(null);
    setFormNom('');
    setFormPrenom('');
    setFormMatricule(`MAT-0${collaborateurs.length + 105}`);
    setFormEmail('');
    setFormGenre('F');
    setFormStatut('EMP');
    setFormDept('Informatique & Tech');
    setFormPoste('');
    setFormDateEntree(new Date().toISOString().slice(0, 10));
    setShowAddModal(true);
  };

  const openEdit = (c: Collaborateur) => {
    setEditingCollab(c);
    setFormNom(c.nom);
    setFormPrenom(c.prenom);
    setFormMatricule(c.matricule);
    setFormEmail(c.email || '');
    setFormGenre(c.genre);
    setFormStatut(c.statut || 'EMP');
    setFormDept(c.departement);
    setFormPoste(c.poste);
    setFormDateEntree(c.dateEntree);
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNom.trim() || !formPrenom.trim()) return;

    if (editingCollab) {
      const updated: Collaborateur = {
        ...editingCollab,
        nom: formNom.trim(),
        prenom: formPrenom.trim(),
        matricule: formMatricule.trim(),
        email: formEmail.trim(), // Keep empty if empty, no auto-generation
        genre: formGenre,
        statut: formStatut,
        departement: formDept.trim(),
        poste: formPoste.trim(),
        dateEntree: formDateEntree
      };
      onUpdateCollaborateur(updated);
    } else {
      const newC: Collaborateur = {
        id: `collab-${Date.now()}`,
        nom: formNom.trim(),
        prenom: formPrenom.trim(),
        matricule: formMatricule.trim(),
        email: formEmail.trim(), // Keep empty if empty, no auto-generation
        genre: formGenre,
        statut: formStatut,
        departement: formDept.trim(),
        poste: formPoste.trim(),
        dateEntree: formDateEntree
      };
      onAddCollaborateur(newC);
    }

    setShowAddModal(false);
  };

  // Helper component for sortable column header
  const SortableHeader = ({ col, label }: { col: SortColumn; label: string }) => {
    const isActive = sortColumn === col;
    return (
      <th 
        onClick={() => handleSort(col)}
        className="py-3 px-3 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-slate-400 group-hover:text-slate-700">
            {isActive ? (
              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-slate-900" /> : <ArrowDown className="h-3 w-3 text-slate-900" />
            ) : (
              <ArrowUpDown className="h-2.5 w-2.5 opacity-40 group-hover:opacity-100" />
            )}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      {/* Editorial Open-Air Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Collaborateurs
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {collaborateurs.length} salariés actifs • Référentiel des compétences, parité F/H et historique de formation
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => exportCurrentCollaborateursToExcel(collaborateurs)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Exporter tous les collaborateurs dans un fichier Excel"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Importer un fichier Excel de collaborateurs"
          >
            <Upload className="h-3.5 w-3.5 text-stone-500" />
            <span>{isUploading ? 'Import...' : 'Importer'}</span>
          </button>

          <button
            onClick={downloadCollaborateursTemplate}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            title="Télécharger le modèle vierge"
          >
            <span>Modèle</span>
          </button>

          <button
            id="btn-add-collab"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nouveau salarié</span>
          </button>
        </div>
      </div>

      {uploadSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccessMsg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher nom, prénom, matricule, statut, poste..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-800 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-700 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          >
            <option value="ALL">Tous les départements ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-700 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          >
            <option value="ALL">Tous statuts</option>
            <option value="EMP">EMP (Employé)</option>
            <option value="CDT">CDT (Conducteur)</option>
            <option value="ATE">ATE (Atelier)</option>
            <option value="AMT">AMT (Maîtrise)</option>
            <option value="A4B">A4B (Haute maîtrise)</option>
            <option value="CAD">CAD (Cadre)</option>
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-700 focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
          >
            <option value="ALL">Tous genres (Parité)</option>
            <option value="F">Femmes ({collaborateurs.filter((c) => c.genre === 'F').length})</option>
            <option value="H">Hommes ({collaborateurs.filter((c) => c.genre === 'H').length})</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <SortableHeader col="nom" label="Collaborateur" />
                <SortableHeader col="matricule" label="Matricule" />
                <SortableHeader col="statut" label="Statut" />
                <SortableHeader col="genre" label="Genre" />
                <SortableHeader col="poste" label="Service / Poste" />
                <SortableHeader col="formations" label="Formations suivies" />
                <SortableHeader col="souhaits" label="Souhaits Forms" />
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((collab) => {
                const history = getCollaborateurHistory(collab.id, sessions, souhaits);
                return (
                  <tr key={collab.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div
                        onClick={() => setSelectedPassportCollab(collab)}
                        className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer flex items-center gap-2"
                      >
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {collab.prenom[0]}{collab.nom[0]}
                        </div>
                        <div>
                          <span>{collab.nom.toUpperCase()} {collab.prenom}</span>
                          {collab.email ? (
                            <span className="block text-[11px] font-normal text-slate-400">{collab.email}</span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-600">
                      {collab.matricule}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        title={STATUT_LABELS[collab.statut as CollaborateurStatut] || collab.statut || 'Employé'}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 cursor-help"
                      >
                        {collab.statut || 'EMP'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        collab.genre === 'F' 
                          ? 'bg-amber-100 text-amber-800 border-amber-200/80' 
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200/80'
                      }`}>
                        {collab.genre === 'F' ? 'Femme' : 'Homme'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800">{collab.poste}</span>
                      <span className="block text-[11px] text-slate-500">{collab.departement}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900">{history.totalSessions} session{history.totalSessions > 1 ? 's' : ''}</span>
                      <span className="text-[11px] text-slate-400 block">{history.totalHeures}h cumulées</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700">{history.souhaitsCollab.length} souhait{history.souhaitsCollab.length > 1 ? 's' : ''}</span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedPassportCollab(collab)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-900 rounded-md hover:bg-indigo-50"
                        title="Voir le passeport formation"
                      >
                        <Award className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(collab)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                        title="Modifier le collaborateur"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aucun collaborateur trouvé pour ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collaborator Passport Slide-over / Modal */}
      {selectedPassportCollab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                  {selectedPassportCollab.prenom[0]}{selectedPassportCollab.nom[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedPassportCollab.nom.toUpperCase()} {selectedPassportCollab.prenom}
                    </h3>
                    <span
                      title={STATUT_LABELS[selectedPassportCollab.statut as CollaborateurStatut] || selectedPassportCollab.statut}
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 cursor-help"
                    >
                      {selectedPassportCollab.statut || 'EMP'} {STATUT_LABELS[selectedPassportCollab.statut as CollaborateurStatut] ? `• ${STATUT_LABELS[selectedPassportCollab.statut as CollaborateurStatut]}` : ''}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedPassportCollab.genre === 'F'
                        ? 'bg-amber-100 text-amber-800 border-amber-200/80'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200/80'
                    }`}>
                      {selectedPassportCollab.genre === 'F' ? 'Femme' : 'Homme'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedPassportCollab.matricule} • {selectedPassportCollab.poste} ({selectedPassportCollab.departement})
                    {selectedPassportCollab.email && ` • ${selectedPassportCollab.email}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPassportCollab(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Stats */}
              {(() => {
                const h = getCollaborateurHistory(selectedPassportCollab.id, sessions, souhaits);
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <div>
                        <span className="text-[11px] text-slate-500">Sessions</span>
                        <p className="text-lg font-bold text-slate-900">{h.totalSessions}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Volume horaire</span>
                        <p className="text-lg font-bold text-indigo-700">{h.totalHeures}h</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Budget alloué</span>
                        <p className="text-lg font-bold text-emerald-700">{h.totalBudgetIndividuel} €</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
                        Sessions de formation suivies ({h.sessionsSuivies.length})
                      </h4>
                      <div className="space-y-2">
                        {h.sessionsSuivies.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedPassportCollab(null);
                              onSelectSession(s);
                            }}
                            className="p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition-colors space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">{s.libelle}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-medium">
                                {s.statut}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex justify-between">
                              <span>{s.organisme} • {s.dureeHeures}h</span>
                              <span>Du {s.dateDebut} au {s.dateFin}</span>
                            </div>
                          </div>
                        ))}

                        {h.sessionsSuivies.length === 0 && (
                          <p className="text-slate-400 text-center py-4">Aucune session enregistrée.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
                        Besoins et souhaits exprimés ({h.souhaitsCollab.length})
                      </h4>
                      <div className="space-y-2">
                        {h.souhaitsCollab.map((sw) => (
                          <div key={sw.id} className="p-3 border border-slate-200 rounded-xl bg-white space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">{sw.intituleSouhait}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                                {sw.statut}
                              </span>
                            </div>
                            {sw.motivation && <p className="text-[11px] text-slate-500 italic">"{sw.motivation}"</p>}
                          </div>
                        ))}

                        {h.souhaitsCollab.length === 0 && (
                          <p className="text-slate-400 text-center py-4">Aucun souhait exprimé.</p>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Collaborateur Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingCollab ? 'Modifier le collaborateur' : 'Ajouter un collaborateur'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={formPrenom}
                    onChange={(e) => setFormPrenom(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Matricule</label>
                  <input
                    type="text"
                    required
                    value={formMatricule}
                    onChange={(e) => setFormMatricule(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut</label>
                  <select
                    value={formStatut}
                    onChange={(e) => setFormStatut(e.target.value as CollaborateurStatut)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                  >
                    <option value="EMP">EMP (Employé)</option>
                    <option value="CDT">CDT (Conducteur)</option>
                    <option value="ATE">ATE (Atelier)</option>
                    <option value="AMT">AMT (Maîtrise)</option>
                    <option value="A4B">A4B (Haute maîtrise)</option>
                    <option value="CAD">CAD (Cadre)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Genre</label>
                  <select
                    value={formGenre}
                    onChange={(e) => setFormGenre(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="F">Femme</option>
                    <option value="H">Homme</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email (optionnel)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Laisser vide si aucun e-mail professionnel"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Département</label>
                  <input
                    type="text"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Poste</label>
                  <input
                    type="text"
                    value={formPoste}
                    onChange={(e) => setFormPoste(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
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
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
