import * as XLSX from 'xlsx';
import { Collaborateur, FormationSession, SouhaitFormation, PresenceStatus, FormationType, SessionStatus, OPCOStatus, CollaborateurStatut } from '../types';

// Helper to sanitize and normalize boolean strings from Excel (OUI/NON, true/false, 1/0)
const parseBoolean = (val: any, defaultVal = false): boolean => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  const str = String(val).trim().toUpperCase();
  return str === 'OUI' || str === 'YES' || str === 'VRAI' || str === 'TRUE' || str === '1';
};

// Helper to format date to YYYY-MM-DD
const formatDate = (val: any, fallback: string): string => {
  if (!val) return fallback;
  if (typeof val === 'number') {
    // Excel serial date to JS Date
    const jsDate = new Date((val - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString().slice(0, 10);
    }
  }
  const str = String(val).trim();
  // If DD/MM/YYYY
  const frMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (frMatch) {
    const day = frMatch[1].padStart(2, '0');
    const month = frMatch[2].padStart(2, '0');
    const year = frMatch[3];
    return `${year}-${month}-${day}`;
  }
  // If YYYY-MM-DD
  const isoMatch = str.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch) {
    return str.slice(0, 10);
  }
  return fallback;
};

// ==========================================
// PREDEFINED HEADERS & EMPTY-SAFE SHEET BUILDER
// ==========================================

export const COLLABORATEURS_HEADERS = [
  'ID Collaborateur',
  'Matricule',
  'Nom',
  'Prénom',
  'Email',
  'Genre (F/H)',
  'Statut',
  'Département',
  'Poste',
  'Date Entrée (AAAA-MM-JJ)'
];

export const SESSIONS_HEADERS = [
  'ID Session',
  'Libellé Formation',
  'Organisme',
  'Type Formation',
  'Date Début (AAAA-MM-JJ)',
  'Date Fin (AAAA-MM-JJ)',
  'Horaires',
  'Durée (Jours)',
  'Durée (Heures)',
  'Coût Pédagogique (€)',
  'Frais Annexes (€)',
  'Statut Session',
  'Participants (Matricules)',
  'Déclaration OPCO',
  'Nom OPCO',
  'N° Dossier OPCO',
  'Montant Accordé OPCO (€)',
  'Subrogation OPCO',
  'Statut Dossier OPCO',
  'Salle Réservée',
  'Nom Salle',
  'Repas Commandés',
  'Convocation Envoyée',
  'Formation à Recycler',
  'Périodicité Recyclage (Mois)',
  'Intitulé Recyclage',
  'Description'
];

export const SOUHAITS_HEADERS = [
  'ID Souhait',
  'Matricule Collaborateur',
  'Nom & Prénom',
  'Intitulé de la formation souhaitée',
  'Domaine / Thématique',
  'Niveau de Priorité',
  'Date Souhait (AAAA-MM-JJ)',
  'Statut Souhait',
  'Source Recueil',
  'Motivation'
];

export const SOUHAITS_INDIVIDUAL_HEADERS = [
  'ID Souhait',
  'Matricule Collaborateur',
  'Nom & Prénom',
  'Intitulé de la formation souhaitée',
  'Domaine / Thématique',
  'Niveau de Priorité',
  'Date Souhait (AAAA-MM-JJ)',
  'Statut Souhait',
  'Source Recueil',
  'Motivation et Objectifs'
];

export const LOGISTIQUE_HEADERS = [
  'ID Session',
  'Libellé Formation',
  'Dates',
  'Salle Réservée (OUI/NON)',
  'Nom Salle',
  'Plateaux Repas Commandés (OUI/NON)',
  'Détails Restauration',
  'Convocation Envoyée (OUI/NON)',
  'Date Convocation',
  'Notes Logistiques'
];

export const LOGISTIQUE_MASTER_HEADERS = [
  'ID Session',
  'Libellé Formation',
  'Salle Réservée (OUI/NON)',
  'Nom Salle',
  'Plateaux Repas Commandés (OUI/NON)',
  'Détails Restauration',
  'Convocation Envoyée (OUI/NON)',
  'Date Convocation',
  'Notes Logistiques'
];

export const EVALUATIONS_HEADERS = [
  'ID Session',
  'Libellé Formation',
  'Éval Chaud Effectuée (OUI/NON)',
  'Note Globale Chaud (/5)',
  'Note Contenu (/5)',
  'Note Formateur (/5)',
  'Note Organisation (/5)',
  'Taux Recommandation (%)',
  'Points Forts',
  'Axes Amélioration',
  'Éval Froid Requise (OUI/NON)',
  'Date Prévue Éval Froid',
  'Éval Froid Effectuée (OUI/NON)',
  'Note Impact Opérationnel (/5)',
  'Mise en Pratique',
  'Retour Manager'
];

export const EVALUATIONS_INDIVIDUAL_HEADERS = [
  'ID Session',
  'Libellé Formation',
  'Date Fin',
  'Statut',
  'Éval Chaud Effectuée (OUI/NON)',
  'Note Globale Chaud (/5)',
  'Note Contenu (/5)',
  'Note Formateur (/5)',
  'Note Organisation (/5)',
  'Taux Recommandation (%)',
  'Points Forts',
  'Axes Amélioration',
  'Éval Froid Requise (OUI/NON)',
  'Date Prévue Éval Froid',
  'Éval Froid Effectuée (OUI/NON)',
  'Note Impact Opérationnel (/5)',
  'Mise en Pratique',
  'Retour Manager'
];

export const RECYCLAGES_HEADERS = [
  'ID Session',
  'Libellé Formation',
  'Organisme',
  'Date Fin',
  'Formation à Recycler (OUI/NON)',
  'Périodicité en Mois (ex: 24 pour SST)',
  'Intitulé du Recyclage',
  'Date Recyclage Prévue (AAAA-MM-JJ)'
];

export const OPCO_REPORT_HEADERS = [
  'Session',
  'Dates',
  'Organisme',
  'OPCO',
  'N° Dossier',
  'Date Dépôt',
  'Statut Dossier',
  'Mode',
  'Coût Total Formation (€)',
  'Montant Accordé OPCO (€)',
  'Reste à Charge Entreprise (€)',
  'Commentaires'
];

/**
 * Creates an Excel worksheet guaranteed to contain column headers even when data is empty.
 */
export const createSheetWithHeaders = (
  rows: Record<string, any>[],
  headers: string[]
): XLSX.WorkSheet => {
  let ws: XLSX.WorkSheet;
  if (!rows || rows.length === 0) {
    ws = XLSX.utils.aoa_to_sheet([headers]);
  } else {
    ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  }

  ws['!cols'] = headers.map((h) => ({
    wch: Math.max(h.length + 3, 14)
  }));

  return ws;
};

// ==========================================
// 1. COLLABORATEURS: EXPORT & RE-IMPORT
// ==========================================

export const exportCurrentCollaborateursToExcel = (collaborateurs: Collaborateur[]) => {
  const rows = collaborateurs.map((c) => ({
    'ID Collaborateur': c.id,
    'Matricule': c.matricule,
    'Nom': c.nom,
    'Prénom': c.prenom,
    'Email': c.email,
    'Genre (F/H)': c.genre,
    'Statut': c.statut || 'EMP',
    'Département': c.departement,
    'Poste': c.poste,
    'Date Entrée (AAAA-MM-JJ)': c.dateEntree
  }));

  const ws = createSheetWithHeaders(rows, COLLABORATEURS_HEADERS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Collaborateurs');
  XLSX.writeFile(wb, `Collaborateurs_Export_Modifiable_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const importCollaborateursFromExcel = async (
  file: File,
  existingCollaborateurs: Collaborateur[]
): Promise<{
  updatedCollaborateurs: Collaborateur[];
  updatedCount: number;
  createdCount: number;
}> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('collab')) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  let updatedCount = 0;
  let createdCount = 0;

  const currentMap = new Map<string, Collaborateur>();
  // Index by ID and by Matricule
  existingCollaborateurs.forEach((c) => {
    currentMap.set(c.id, { ...c });
    currentMap.set(c.matricule.toLowerCase().trim(), { ...c });
  });

  const finalCollabs: Collaborateur[] = [...existingCollaborateurs];

  rawRows.forEach((row, index) => {
    const rawId = String(row['ID Collaborateur'] || row['ID'] || row['id'] || '').trim();
    const matricule = String(row['Matricule'] || row['matricule'] || `MAT-${1000 + index}`).trim();
    const nom = String(row['Nom'] || row['nom'] || 'Nom Inconnu').trim();
    const prenom = String(row['Prénom'] || row['Prenom'] || row['prenom'] || '').trim();
    const email = String(row['Email'] || row['email'] || '').trim();
    
    const genreRaw = String(row['Genre (F/H)'] || row['Genre'] || row['genre'] || 'F').toUpperCase();
    const genre: 'F' | 'H' | 'Autre' = genreRaw.startsWith('H') || genreRaw === 'M' || genreRaw.includes('HOMME') ? 'H' : 'F';

    const rawStatut = String(row['Statut'] || row['statut'] || '').trim().toUpperCase();
    let statut: CollaborateurStatut = 'EMP';
    if (rawStatut === 'A4B' || rawStatut.includes('HAUTE') || rawStatut.includes('4B')) {
      statut = 'A4B';
    } else if (rawStatut === 'AMT' || rawStatut.includes('MAITRISE') || rawStatut.includes('MAÎTRISE')) {
      statut = 'AMT';
    } else if (rawStatut === 'ATE' || rawStatut.includes('ATELIER')) {
      statut = 'ATE';
    } else if (rawStatut === 'CDT' || rawStatut.includes('CONDUCTEUR')) {
      statut = 'CDT';
    } else if (rawStatut === 'CAD' || rawStatut.includes('CADRE')) {
      statut = 'CAD';
    } else if (rawStatut === 'EMP' || rawStatut.includes('EMPLOY')) {
      statut = 'EMP';
    }
    
    const departement = String(row['Département'] || row['Departement'] || row['departement'] || 'Général').trim();
    const poste = String(row['Poste'] || row['poste'] || 'Collaborateur').trim();
    const dateEntree = formatDate(row['Date Entrée (AAAA-MM-JJ)'] || row['DateEntree'] || row['Date Entrée'], '2023-01-01');

    // Check if collaborator exists by ID first, then by Matricule
    const existingIndex = finalCollabs.findIndex(
      (c) => (rawId && c.id === rawId) || c.matricule.toLowerCase() === matricule.toLowerCase()
    );

    if (existingIndex >= 0) {
      // UPDATE existing
      finalCollabs[existingIndex] = {
        ...finalCollabs[existingIndex],
        matricule,
        nom,
        prenom,
        email,
        genre,
        statut,
        departement,
        poste,
        dateEntree
      };
      updatedCount++;
    } else {
      // CREATE new
      const newId = rawId || `collab-${Date.now()}-${index}`;
      finalCollabs.push({
        id: newId,
        matricule,
        nom,
        prenom,
        email,
        genre,
        statut,
        departement,
        poste,
        dateEntree
      });
      createdCount++;
    }
  });

  return {
    updatedCollaborateurs: finalCollabs,
    updatedCount,
    createdCount
  };
};

// ==========================================
// 2. SESSIONS: EXPORT & RE-IMPORT
// ==========================================

export const exportCurrentSessionsToExcel = (
  sessions: FormationSession[],
  collaborateurs: Collaborateur[]
) => {
  const collabMap = new Map(collaborateurs.map((c) => [c.id, c]));

  const rows = sessions.map((s) => {
    const matriculesParticipants = s.participants
      .map((p) => {
        const c = collabMap.get(p.collaborateurId);
        return c ? c.matricule : p.collaborateurId;
      })
      .join(', ');

    return {
      'ID Session': s.id,
      'Libellé Formation': s.libelle,
      'Organisme': s.organisme,
      'Type Formation': s.type,
      'Date Début (AAAA-MM-JJ)': s.dateDebut,
      'Date Fin (AAAA-MM-JJ)': s.dateFin,
      'Horaires': s.horaires || '09:00 - 17:00',
      'Durée (Jours)': s.dureeJours,
      'Durée (Heures)': s.dureeHeures,
      'Coût Pédagogique (€)': s.coutPedagogiqueTotal,
      'Frais Annexes (€)': s.fraisAnnexesTotal || 0,
      'Statut Session': s.statut,
      'Participants (Matricules)': matriculesParticipants,
      'Déclaration OPCO': s.opco.declare ? 'OUI' : 'NON',
      'Nom OPCO': s.opco.nomOpco,
      'N° Dossier OPCO': s.opco.numeroDossier,
      'Montant Accordé OPCO (€)': s.opco.montantPrisEnCharge,
      'Subrogation OPCO': s.opco.subrogation ? 'OUI' : 'NON',
      'Statut Dossier OPCO': s.opco.statut,
      'Salle Réservée': s.logistique.salleReservee ? 'OUI' : 'NON',
      'Nom Salle': s.logistique.nomSalle || '',
      'Repas Commandés': s.logistique.plateauxRepasCommandes ? 'OUI' : 'NON',
      'Convocation Envoyée': s.logistique.convocationEnvoyee ? 'OUI' : 'NON',
      'Formation à Recycler': s.recyclage.aRecycler ? 'OUI' : 'NON',
      'Périodicité Recyclage (Mois)': s.recyclage.periodiciteMois || 24,
      'Intitulé Recyclage': s.recyclage.intituleRecyclage || ''
    };
  });

  const ws = createSheetWithHeaders(rows, SESSIONS_HEADERS.filter((h) => h !== 'Description'));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sessions');
  XLSX.writeFile(wb, `Sessions_Export_Modifiable_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const importSessionsFromExcel = async (
  file: File,
  existingSessions: FormationSession[],
  collaborateurs: Collaborateur[]
): Promise<{
  updatedSessions: FormationSession[];
  updatedCount: number;
  createdCount: number;
}> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('session')) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  let updatedCount = 0;
  let createdCount = 0;

  const finalSessions: FormationSession[] = [...existingSessions];
  const matriculeToIdMap = new Map<string, string>();
  collaborateurs.forEach((c) => {
    matriculeToIdMap.set(c.matricule.toLowerCase().trim(), c.id);
    matriculeToIdMap.set(c.email.toLowerCase().trim(), c.id);
    matriculeToIdMap.set(c.id.toLowerCase().trim(), c.id);
  });

  rawRows.forEach((row, index) => {
    const rawId = String(row['ID Session'] || row['ID'] || row['id'] || '').trim();
    const libelle = String(row['Libellé Formation'] || row['Libelle'] || row['Titre'] || 'Nouvelle Formation').trim();
    const organisme = String(row['Organisme'] || row['Organisme de Formation'] || 'Organisme Interne').trim();
    const type = (row['Type Formation'] || row['Type'] || 'Métier / Technique') as FormationType;
    
    const dateDebut = formatDate(row['Date Début (AAAA-MM-JJ)'] || row['Date Début'] || row['DateDebut'], new Date().toISOString().slice(0, 10));
    const dateFin = formatDate(row['Date Fin (AAAA-MM-JJ)'] || row['Date Fin'] || row['DateFin'], dateDebut);
    const horaires = String(row['Horaires'] || '09:00 - 17:00').trim();

    const dureeJours = Number(row['Durée (Jours)'] || row['DureeJours'] || 1) || 1;
    const dureeHeures = Number(row['Durée (Heures)'] || row['DureeHeures'] || dureeJours * 7) || 7;
    const coutPedagogiqueTotal = Number(row['Coût Pédagogique (€)'] || row['CoutPedagogique'] || 0) || 0;
    const fraisAnnexesTotal = Number(row['Frais Annexes (€)'] || row['FraisAnnexes'] || 0) || 0;

    const statutRaw = String(row['Statut Session'] || row['Statut'] || 'A_VENIR').trim().toUpperCase();
    const statut: SessionStatus = ['A_VENIR', 'EN_COURS', 'TERMINEE', 'ANNULEE'].includes(statutRaw)
      ? (statutRaw as SessionStatus)
      : 'A_VENIR';

    // Parse participants from comma-separated matricules
    const participantsRaw = String(row['Participants (Matricules)'] || row['Participants'] || '').trim();
    let participants = participantsRaw
      ? participantsRaw.split(/[,;]/).map((item) => {
          const clean = item.trim().toLowerCase();
          const collabId = matriculeToIdMap.get(clean) || clean;
          return {
            collaborateurId: collabId,
            status: (statut === 'TERMINEE' ? 'PRESENT' : 'EN_ATTENTE') as PresenceStatus
          };
        }).filter((p) => p.collaborateurId.length > 0)
      : [];

    // Parse OPCO
    const opcoDeclare = parseBoolean(row['Déclaration OPCO'] || row['OPCO Déclaré']);
    const nomOpco = String(row['Nom OPCO'] || 'ATLAS').trim();
    const numeroDossier = String(row['N° Dossier OPCO'] || '').trim();
    const montantPrisEnCharge = Number(row['Montant Accordé OPCO (€)'] || row['Prise en charge OPCO (€)'] || 0) || 0;
    const subrogation = parseBoolean(row['Subrogation OPCO'], true);
    const statutOPCO: OPCOStatus = (row['Statut Dossier OPCO'] || (opcoDeclare ? 'EN_INSTRUCTION' : 'NON_DEPOSE')) as OPCOStatus;

    // Parse Logistique
    const salleReservee = parseBoolean(row['Salle Réservée']);
    const nomSalle = String(row['Nom Salle'] || '').trim();
    const plateauxRepasCommandes = parseBoolean(row['Repas Commandés'] || row['Plateaux Repas']);
    const convocationEnvoyee = parseBoolean(row['Convocation Envoyée']);

    // Parse Recyclage
    const aRecycler = parseBoolean(row['Formation à Recycler']);
    const periodiciteMois = Number(row['Périodicité Recyclage (Mois)'] || 24) || 24;
    const intituleRecyclage = String(row['Intitulé Recyclage'] || '').trim();

    // Check if session exists
    const existingIndex = finalSessions.findIndex((s) => rawId && s.id === rawId);

    if (existingIndex >= 0) {
      // UPDATE
      const curr = finalSessions[existingIndex];
      finalSessions[existingIndex] = {
        ...curr,
        libelle,
        organisme,
        type,
        dateDebut,
        dateFin,
        horaires,
        dureeJours,
        dureeHeures,
        coutPedagogiqueTotal,
        fraisAnnexesTotal,
        statut,
        participants: participants.length > 0 ? participants : curr.participants,
        opco: {
          ...curr.opco,
          declare: opcoDeclare,
          nomOpco,
          numeroDossier,
          montantPrisEnCharge,
          subrogation,
          statut: statutOPCO
        },
        logistique: {
          ...curr.logistique,
          salleReservee,
          nomSalle,
          plateauxRepasCommandes,
          convocationEnvoyee
        },
        recyclage: {
          ...curr.recyclage,
          aRecycler,
          periodiciteMois,
          intituleRecyclage
        }
      };
      updatedCount++;
    } else {
      // CREATE
      const newId = rawId || `session-${Date.now()}-${index}`;
      finalSessions.push({
        id: newId,
        libelle,
        organisme,
        type,
        dateDebut,
        dateFin,
        horaires,
        dureeJours,
        dureeHeures,
        coutPedagogiqueTotal,
        fraisAnnexesTotal,
        statut,
        participants,
        logistique: {
          salleReservee,
          nomSalle,
          plateauxRepasCommandes,
          detailsRestauration: plateauxRepasCommandes ? 'Plateaux traiteur standard' : '',
          convocationEnvoyee
        },
        evaluationChaud: {
          effectuee: statut === 'TERMINEE'
        },
        evaluationFroid: {
          requise: true,
          datePrevue: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
          rappelEnvoye: false,
          effectuee: false
        },
        opco: {
          declare: opcoDeclare,
          nomOpco,
          numeroDossier,
          montantPrisEnCharge,
          fraisAnnexesPrisEnCharge: 0,
          subrogation,
          statut: statutOPCO
        },
        recyclage: {
          aRecycler,
          periodiciteMois,
          intituleRecyclage
        },
        createdAt: new Date().toISOString()
      });
      createdCount++;
    }
  });

  return {
    updatedSessions: finalSessions,
    updatedCount,
    createdCount
  };
};

// ==========================================
// 3. SOUHAITS: EXPORT & RE-IMPORT
// ==========================================

export const exportCurrentSouhaitsToExcel = (
  souhaits: SouhaitFormation[],
  collaborateurs: Collaborateur[]
) => {
  const collabMap = new Map(collaborateurs.map((c) => [c.id, c]));

  const rows = souhaits.map((sw) => {
    const c = collabMap.get(sw.collaborateurId);
    return {
      'ID Souhait': sw.id,
      'Matricule Collaborateur': c ? c.matricule : '',
      'Nom & Prénom': c ? `${c.nom} ${c.prenom}` : 'Inconnu',
      'Intitulé de la formation souhaitée': sw.intituleSouhait,
      'Domaine / Thématique': sw.domaine,
      'Niveau de Priorité': sw.priorite,
      'Date Souhait (AAAA-MM-JJ)': sw.dateSouhait,
      'Statut Souhait': sw.statut,
      'Source Recueil': sw.source,
      'Motivation et Objectifs': sw.motivation || ''
    };
  });

  const ws = createSheetWithHeaders(rows, SOUHAITS_INDIVIDUAL_HEADERS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Souhaits_Formation');
  XLSX.writeFile(wb, `Souhaits_Export_Modifiable_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const importSouhaitsFromExcel = async (
  file: File,
  existingSouhaits: SouhaitFormation[],
  collaborateurs: Collaborateur[]
): Promise<{
  updatedSouhaits: SouhaitFormation[];
  updatedCount: number;
  createdCount: number;
}> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('souhait')) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  let updatedCount = 0;
  let createdCount = 0;

  const finalSouhaits: SouhaitFormation[] = [...existingSouhaits];

  rawRows.forEach((row, index) => {
    const rawId = String(row['ID Souhait'] || row['ID'] || row['id'] || '').trim();
    const identifiantCollab = String(
      row['Matricule Collaborateur'] || row['Matricule ou Email'] || row['Matricule'] || row['Nom & Prénom'] || ''
    ).trim().toLowerCase();

    const foundCollab = collaborateurs.find((c) => {
      return (
        c.matricule.toLowerCase() === identifiantCollab ||
        c.email.toLowerCase() === identifiantCollab ||
        c.id.toLowerCase() === identifiantCollab ||
        `${c.nom} ${c.prenom}`.toLowerCase().includes(identifiantCollab) ||
        `${c.prenom} ${c.nom}`.toLowerCase().includes(identifiantCollab)
      );
    });

    const collaborateurId = foundCollab ? foundCollab.id : (collaborateurs[0]?.id || 'collab-1');

    const intituleSouhait = String(
      row['Intitulé de la formation souhaitée'] || row['Intitulé'] || row['Formation'] || 'Formation demandée'
    ).trim();

    const domaine = String(row['Domaine / Thématique'] || row['Domaine'] || foundCollab?.departement || 'Général').trim();

    const prioriteRaw = String(row['Niveau de Priorité'] || row['Priorité'] || 'MOYENNE').toUpperCase();
    let priorite: 'HAUTE' | 'MOYENNE' | 'BASSE' = 'MOYENNE';
    if (prioriteRaw.includes('HAUT') || prioriteRaw.includes('URGENT')) priorite = 'HAUTE';
    else if (prioriteRaw.includes('BAS')) priorite = 'BASSE';

    const dateSouhait = formatDate(row['Date Souhait (AAAA-MM-JJ)'] || row['Date Souhait'], new Date().toISOString().slice(0, 10));

    const statutRaw = String(row['Statut Souhait'] || row['Statut'] || 'EN_ATTENTE').toUpperCase();
    const statut = ['EN_ATTENTE', 'PLANIFIE', 'REALISE', 'REPORTE'].includes(statutRaw)
      ? (statutRaw as any)
      : 'EN_ATTENTE';

    const source = String(row['Source Recueil'] || row['Source'] || 'Import Excel') as any;
    const motivation = String(row['Motivation et Objectifs'] || row['Motivation'] || '').trim();

    const existingIndex = finalSouhaits.findIndex((s) => rawId && s.id === rawId);

    if (existingIndex >= 0) {
      // UPDATE
      finalSouhaits[existingIndex] = {
        ...finalSouhaits[existingIndex],
        intituleSouhait,
        domaine,
        priorite,
        statut,
        dateSouhait,
        motivation,
        source
      };
      updatedCount++;
    } else {
      // CREATE
      const newId = rawId || `souhait-${Date.now()}-${index}`;
      finalSouhaits.push({
        id: newId,
        collaborateurId,
        intituleSouhait,
        domaine,
        priorite,
        dateSouhait,
        statut,
        motivation,
        source
      });
      createdCount++;
    }
  });

  return {
    updatedSouhaits: finalSouhaits,
    updatedCount,
    createdCount
  };
};

// ==========================================
// 4. LOGISTIQUE: EXPORT & RE-IMPORT
// ==========================================

export const exportCurrentLogistiqueToExcel = (
  sessions: FormationSession[],
  _collaborateurs?: Collaborateur[]
) => {
  const rows = sessions.map((s) => ({
    'ID Session': s.id,
    'Libellé Formation': s.libelle,
    'Dates': `${s.dateDebut} au ${s.dateFin}`,
    'Salle Réservée (OUI/NON)': s.logistique.salleReservee ? 'OUI' : 'NON',
    'Nom Salle': s.logistique.nomSalle || '',
    'Plateaux Repas Commandés (OUI/NON)': s.logistique.plateauxRepasCommandes ? 'OUI' : 'NON',
    'Détails Restauration': s.logistique.detailsRestauration || '',
    'Convocation Envoyée (OUI/NON)': s.logistique.convocationEnvoyee ? 'OUI' : 'NON',
    'Date Convocation': s.logistique.dateConvocation || '',
    'Notes Logistiques': s.logistique.notesLogistiques || ''
  }));

  const ws = createSheetWithHeaders(rows, LOGISTIQUE_HEADERS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Logistique_Sessions');
  XLSX.writeFile(wb, `Logistique_Export_Modifiable_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const importLogistiqueFromExcel = async (
  file: File,
  existingSessions: FormationSession[]
): Promise<{
  updatedSessions: FormationSession[];
  updatedCount: number;
}> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('logist')) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  let updatedCount = 0;
  const finalSessions = [...existingSessions];

  rawRows.forEach((row) => {
    const rawId = String(row['ID Session'] || row['ID'] || '').trim();
    if (!rawId) return;

    const idx = finalSessions.findIndex((s) => s.id === rawId);
    if (idx >= 0) {
      finalSessions[idx] = {
        ...finalSessions[idx],
        logistique: {
          ...finalSessions[idx].logistique,
          salleReservee: parseBoolean(row['Salle Réservée (OUI/NON)'] ?? row['Salle Réservée']),
          nomSalle: String(row['Nom Salle'] ?? finalSessions[idx].logistique.nomSalle).trim(),
          plateauxRepasCommandes: parseBoolean(row['Plateaux Repas Commandés (OUI/NON)'] ?? row['Plateaux Repas Commandés']),
          detailsRestauration: String(row['Détails Restauration'] ?? finalSessions[idx].logistique.detailsRestauration ?? '').trim(),
          convocationEnvoyee: parseBoolean(row['Convocation Envoyée (OUI/NON)'] ?? row['Convocation Envoyée']),
          dateConvocation: formatDate(row['Date Convocation'], finalSessions[idx].logistique.dateConvocation || ''),
          notesLogistiques: String((row['Notes Logistiques'] ?? finalSessions[idx].logistique.notesLogistiques) || '').trim()
        }
      };
      updatedCount++;
    }
  });

  return {
    updatedSessions: finalSessions,
    updatedCount
  };
};

// ==========================================
// 5. EVALUATIONS: EXPORT & RE-IMPORT
// ==========================================

export const exportCurrentEvaluationsToExcel = (sessions: FormationSession[]) => {
  const rows = sessions.map((s) => ({
    'ID Session': s.id,
    'Libellé Formation': s.libelle,
    'Date Fin': s.dateFin,
    'Statut': s.statut,
    'Éval Chaud Effectuée (OUI/NON)': s.evaluationChaud.effectuee ? 'OUI' : 'NON',
    'Note Globale Chaud (/5)': s.evaluationChaud.noteGlobale || '',
    'Note Contenu (/5)': s.evaluationChaud.noteContenu || '',
    'Note Formateur (/5)': s.evaluationChaud.noteFormateur || '',
    'Note Organisation (/5)': s.evaluationChaud.noteOrganisation || '',
    'Taux Recommandation (%)': s.evaluationChaud.tauxRecommandation || '',
    'Points Forts': s.evaluationChaud.pointsForts || '',
    'Axes Amélioration': s.evaluationChaud.axesAmelioration || '',
    'Éval Froid Requise (OUI/NON)': s.evaluationFroid.requise ? 'OUI' : 'NON',
    'Date Prévue Éval Froid': s.evaluationFroid.datePrevue || '',
    'Éval Froid Effectuée (OUI/NON)': s.evaluationFroid.effectuee ? 'OUI' : 'NON',
    'Note Impact Opérationnel (/5)': s.evaluationFroid.noteImpactOperationnel || '',
    'Mise en Pratique': s.evaluationFroid.competencesMisesEnPratique || '',
    'Retour Manager': s.evaluationFroid.retourManager || ''
  }));

  const ws = createSheetWithHeaders(rows, EVALUATIONS_INDIVIDUAL_HEADERS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Evaluations_Formation');
  XLSX.writeFile(wb, `Evaluations_Export_Modifiable_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const importEvaluationsFromExcel = async (
  file: File,
  existingSessions: FormationSession[]
): Promise<{
  updatedSessions: FormationSession[];
  updatedCount: number;
}> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('eval')) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  let updatedCount = 0;
  const finalSessions = [...existingSessions];

  rawRows.forEach((row) => {
    const rawId = String(row['ID Session'] || row['ID'] || '').trim();
    if (!rawId) return;

    const idx = finalSessions.findIndex((s) => s.id === rawId);
    if (idx >= 0) {
      const evalChaudEffectuee = parseBoolean(row['Éval Chaud Effectuée (OUI/NON)'] ?? row['Éval Chaud Effectuée']);
      const evalFroidEffectuee = parseBoolean(row['Éval Froid Effectuée (OUI/NON)'] ?? row['Éval Froid Effectuée']);

      finalSessions[idx] = {
        ...finalSessions[idx],
        evaluationChaud: {
          ...finalSessions[idx].evaluationChaud,
          effectuee: evalChaudEffectuee,
          noteGlobale: Number(row['Note Globale Chaud (/5)'] ?? finalSessions[idx].evaluationChaud.noteGlobale) || undefined,
          noteContenu: Number(row['Note Contenu (/5)'] ?? finalSessions[idx].evaluationChaud.noteContenu) || undefined,
          noteFormateur: Number(row['Note Formateur (/5)'] ?? finalSessions[idx].evaluationChaud.noteFormateur) || undefined,
          noteOrganisation: Number(row['Note Organisation (/5)'] ?? finalSessions[idx].evaluationChaud.noteOrganisation) || undefined,
          tauxRecommandation: Number(row['Taux Recommandation (%)'] ?? finalSessions[idx].evaluationChaud.tauxRecommandation) || undefined,
          pointsForts: String((row['Points Forts'] ?? finalSessions[idx].evaluationChaud.pointsForts) || '').trim(),
          axesAmelioration: String((row['Axes Amélioration'] ?? finalSessions[idx].evaluationChaud.axesAmelioration) || '').trim()
        },
        evaluationFroid: {
          ...finalSessions[idx].evaluationFroid,
          requise: parseBoolean(row['Éval Froid Requise (OUI/NON)'], true),
          datePrevue: formatDate(row['Date Prévue Éval Froid'], finalSessions[idx].evaluationFroid.datePrevue),
          effectuee: evalFroidEffectuee,
          noteImpactOperationnel: Number(row['Note Impact Opérationnel (/5)'] ?? finalSessions[idx].evaluationFroid.noteImpactOperationnel) || undefined,
          competencesMisesEnPratique: String((row['Mise en Pratique'] ?? finalSessions[idx].evaluationFroid.competencesMisesEnPratique) || '').trim(),
          retourManager: String((row['Retour Manager'] ?? finalSessions[idx].evaluationFroid.retourManager) || '').trim()
        }
      };
      updatedCount++;
    }
  });

  return {
    updatedSessions: finalSessions,
    updatedCount
  };
};

// ==========================================
// 6. RECYCLAGES: EXPORT & RE-IMPORT
// ==========================================

export const exportCurrentRecyclagesToExcel = (
  sessions: FormationSession[],
  _collaborateurs?: Collaborateur[]
) => {
  const rows = sessions.map((s) => ({
    'ID Session': s.id,
    'Libellé Formation': s.libelle,
    'Organisme': s.organisme,
    'Date Fin': s.dateFin,
    'Formation à Recycler (OUI/NON)': s.recyclage.aRecycler ? 'OUI' : 'NON',
    'Périodicité en Mois (ex: 24 pour SST)': s.recyclage.periodiciteMois || 24,
    'Intitulé du Recyclage': s.recyclage.intituleRecyclage || s.libelle,
    'Date Recyclage Prévue (AAAA-MM-JJ)': s.recyclage.dateRecyclagePrevue || ''
  }));

  const ws = createSheetWithHeaders(rows, RECYCLAGES_HEADERS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Recyclages');
  XLSX.writeFile(wb, `Recyclages_Export_Modifiable_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const importRecyclagesFromExcel = async (
  file: File,
  existingSessions: FormationSession[]
): Promise<{
  updatedSessions: FormationSession[];
  updatedCount: number;
}> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('recycl')) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  let updatedCount = 0;
  const finalSessions = [...existingSessions];

  rawRows.forEach((row) => {
    const rawId = String(row['ID Session'] || row['ID'] || '').trim();
    if (!rawId) return;

    const idx = finalSessions.findIndex((s) => s.id === rawId);
    if (idx >= 0) {
      finalSessions[idx] = {
        ...finalSessions[idx],
        recyclage: {
          ...finalSessions[idx].recyclage,
          aRecycler: parseBoolean(row['Formation à Recycler (OUI/NON)'] ?? row['Formation à Recycler']),
          periodiciteMois: Number(row['Périodicité en Mois (ex: 24 pour SST)'] ?? row['Périodicité (Mois)']) || 24,
          intituleRecyclage: String((row['Intitulé du Recyclage'] ?? row['Intitulé Recyclage'] ?? finalSessions[idx].recyclage.intituleRecyclage) || '').trim(),
          dateRecyclagePrevue: formatDate(row['Date Recyclage Prévue (AAAA-MM-JJ)'], finalSessions[idx].recyclage.dateRecyclagePrevue || '')
        }
      };
      updatedCount++;
    }
  });

  return {
    updatedSessions: finalSessions,
    updatedCount
  };
};

// ==========================================
// 7. MASTER DATABASE (MULTI-SHEETS): EXPORT & RE-IMPORT
// ==========================================

export const exportMasterDatabaseToExcel = (
  sessions: FormationSession[],
  collaborateurs: Collaborateur[],
  souhaits: SouhaitFormation[]
) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Sessions
  const collabMap = new Map(collaborateurs.map((c) => [c.id, c]));
  const sessionRows = sessions.map((s) => ({
    'ID Session': s.id,
    'Libellé Formation': s.libelle,
    'Organisme': s.organisme,
    'Type Formation': s.type,
    'Date Début (AAAA-MM-JJ)': s.dateDebut,
    'Date Fin (AAAA-MM-JJ)': s.dateFin,
    'Horaires': s.horaires || '09:00 - 17:00',
    'Durée (Jours)': s.dureeJours,
    'Durée (Heures)': s.dureeHeures,
    'Coût Pédagogique (€)': s.coutPedagogiqueTotal,
    'Frais Annexes (€)': s.fraisAnnexesTotal || 0,
    'Statut Session': s.statut,
    'Participants (Matricules)': s.participants
      .map((p) => collabMap.get(p.collaborateurId)?.matricule || p.collaborateurId)
      .join(', '),
    'Déclaration OPCO': s.opco.declare ? 'OUI' : 'NON',
    'Nom OPCO': s.opco.nomOpco,
    'N° Dossier OPCO': s.opco.numeroDossier,
    'Montant Accordé OPCO (€)': s.opco.montantPrisEnCharge,
    'Subrogation OPCO': s.opco.subrogation ? 'OUI' : 'NON',
    'Statut Dossier OPCO': s.opco.statut,
    'Salle Réservée': s.logistique.salleReservee ? 'OUI' : 'NON',
    'Nom Salle': s.logistique.nomSalle || '',
    'Repas Commandés': s.logistique.plateauxRepasCommandes ? 'OUI' : 'NON',
    'Convocation Envoyée': s.logistique.convocationEnvoyee ? 'OUI' : 'NON',
    'Formation à Recycler': s.recyclage.aRecycler ? 'OUI' : 'NON',
    'Périodicité Recyclage (Mois)': s.recyclage.periodiciteMois || 24,
    'Intitulé Recyclage': s.recyclage.intituleRecyclage || '',
    'Description': s.description || ''
  }));
  const wsSessions = createSheetWithHeaders(sessionRows, SESSIONS_HEADERS);
  XLSX.utils.book_append_sheet(wb, wsSessions, 'Sessions');

  // Sheet 2: Collaborateurs (with Statut column included)
  const collabRows = collaborateurs.map((c) => ({
    'ID Collaborateur': c.id,
    'Matricule': c.matricule,
    'Nom': c.nom,
    'Prénom': c.prenom,
    'Email': c.email,
    'Genre (F/H)': c.genre,
    'Statut': c.statut || 'EMP',
    'Département': c.departement,
    'Poste': c.poste,
    'Date Entrée (AAAA-MM-JJ)': c.dateEntree
  }));
  const wsCollabs = createSheetWithHeaders(collabRows, COLLABORATEURS_HEADERS);
  XLSX.utils.book_append_sheet(wb, wsCollabs, 'Collaborateurs');

  // Sheet 3: Souhaits
  const souhaitRows = souhaits.map((sw) => {
    const c = collabMap.get(sw.collaborateurId);
    return {
      'ID Souhait': sw.id,
      'Matricule Collaborateur': c ? c.matricule : '',
      'Nom & Prénom': c ? `${c.nom} ${c.prenom}` : 'Inconnu',
      'Intitulé de la formation souhaitée': sw.intituleSouhait,
      'Domaine / Thématique': sw.domaine,
      'Niveau de Priorité': sw.priorite,
      'Date Souhait (AAAA-MM-JJ)': sw.dateSouhait,
      'Statut Souhait': sw.statut,
      'Source Recueil': sw.source || 'Import Excel',
      'Motivation': sw.motivation || ''
    };
  });
  const wsSouhaits = createSheetWithHeaders(souhaitRows, SOUHAITS_HEADERS);
  XLSX.utils.book_append_sheet(wb, wsSouhaits, 'Souhaits');

  // Sheet 4: Logistique
  const logistiqueRows = sessions.map((s) => ({
    'ID Session': s.id,
    'Libellé Formation': s.libelle,
    'Salle Réservée (OUI/NON)': s.logistique.salleReservee ? 'OUI' : 'NON',
    'Nom Salle': s.logistique.nomSalle || '',
    'Plateaux Repas Commandés (OUI/NON)': s.logistique.plateauxRepasCommandes ? 'OUI' : 'NON',
    'Détails Restauration': s.logistique.detailsRestauration || '',
    'Convocation Envoyée (OUI/NON)': s.logistique.convocationEnvoyee ? 'OUI' : 'NON',
    'Date Convocation': s.logistique.dateConvocation || '',
    'Notes Logistiques': s.logistique.notesLogistiques || ''
  }));
  const wsLogistique = createSheetWithHeaders(logistiqueRows, LOGISTIQUE_MASTER_HEADERS);
  XLSX.utils.book_append_sheet(wb, wsLogistique, 'Logistique');

  // Sheet 5: Evaluations
  const evalRows = sessions.map((s) => ({
    'ID Session': s.id,
    'Libellé Formation': s.libelle,
    'Éval Chaud Effectuée (OUI/NON)': s.evaluationChaud.effectuee ? 'OUI' : 'NON',
    'Note Globale Chaud (/5)': s.evaluationChaud.noteGlobale || '',
    'Note Contenu (/5)': s.evaluationChaud.noteContenu || '',
    'Note Formateur (/5)': s.evaluationChaud.noteFormateur || '',
    'Note Organisation (/5)': s.evaluationChaud.noteOrganisation || '',
    'Taux Recommandation (%)': s.evaluationChaud.tauxRecommandation || '',
    'Points Forts': s.evaluationChaud.pointsForts || '',
    'Axes Amélioration': s.evaluationChaud.axesAmelioration || '',
    'Éval Froid Requise (OUI/NON)': s.evaluationFroid.requise ? 'OUI' : 'NON',
    'Date Prévue Éval Froid': s.evaluationFroid.datePrevue || '',
    'Éval Froid Effectuée (OUI/NON)': s.evaluationFroid.effectuee ? 'OUI' : 'NON',
    'Note Impact Opérationnel (/5)': s.evaluationFroid.noteImpactOperationnel || '',
    'Mise en Pratique': s.evaluationFroid.competencesMisesEnPratique || '',
    'Retour Manager': s.evaluationFroid.retourManager || ''
  }));
  const wsEval = createSheetWithHeaders(evalRows, EVALUATIONS_HEADERS);
  XLSX.utils.book_append_sheet(wb, wsEval, 'Evaluations');

  // Sheet 6: Recyclages
  const recyclageRows = sessions.map((s) => ({
    'ID Session': s.id,
    'Libellé Formation': s.libelle,
    'Organisme': s.organisme,
    'Date Fin': s.dateFin,
    'Formation à Recycler (OUI/NON)': s.recyclage.aRecycler ? 'OUI' : 'NON',
    'Périodicité en Mois (ex: 24 pour SST)': s.recyclage.periodiciteMois || 24,
    'Intitulé du Recyclage': s.recyclage.intituleRecyclage || s.libelle,
    'Date Recyclage Prévue (AAAA-MM-JJ)': s.recyclage.dateRecyclagePrevue || ''
  }));
  const wsRecyclage = createSheetWithHeaders(recyclageRows, RECYCLAGES_HEADERS);
  XLSX.utils.book_append_sheet(wb, wsRecyclage, 'Recyclages');

  XLSX.writeFile(wb, `Formation_TABM_Base_Complete_MultiFeuilles_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const importMasterDatabaseFromExcel = async (
  file: File,
  existingSessions: FormationSession[],
  existingCollaborateurs: Collaborateur[],
  existingSouhaits: SouhaitFormation[],
  replaceMode = true // By default, replace all data so deleted rows in Excel disappear from the app!
): Promise<{
  sessions: FormationSession[];
  collaborateurs: Collaborateur[];
  souhaits: SouhaitFormation[];
  summary: string[];
}> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const summary: string[] = [];

  // If replaceMode is TRUE, start with empty arrays for sheets present in the workbook
  // This guarantees that any row deleted in Excel is completely removed from the app!
  let currentSessions = replaceMode ? [] : [...existingSessions];
  let currentCollaborateurs = replaceMode ? [] : [...existingCollaborateurs];
  let currentSouhaits = replaceMode ? [] : [...existingSouhaits];

  // 1. Process Collaborateurs sheet if found
  const collabSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('collab'));
  if (collabSheetName) {
    const baseCollabs = replaceMode ? [] : existingCollaborateurs;
    const res = await importCollaborateursFromExcel(file, baseCollabs);
    currentCollaborateurs = res.updatedCollaborateurs;
    summary.push(`Collaborateurs : ${currentCollaborateurs.length} collaborateur(s) au total (${replaceMode ? 'remplacement complet' : `${res.updatedCount} maj, ${res.createdCount} créés`})`);
  } else if (replaceMode) {
    // If not in file but in replaceMode, keep previous
    currentCollaborateurs = [...existingCollaborateurs];
  }

  // 2. Process Sessions sheet if found
  const sessionSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('session'));
  if (sessionSheetName) {
    const baseSessions = replaceMode ? [] : existingSessions;
    const res = await importSessionsFromExcel(file, baseSessions, currentCollaborateurs);
    currentSessions = res.updatedSessions;
    summary.push(`Sessions : ${currentSessions.length} session(s) au total (${replaceMode ? 'remplacement complet' : `${res.updatedCount} maj, ${res.createdCount} créées`})`);
  } else if (replaceMode) {
    currentSessions = [...existingSessions];
  }

  // 3. Process Souhaits sheet if found
  const souhaitSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('souhait'));
  if (souhaitSheetName) {
    const baseSouhaits = replaceMode ? [] : existingSouhaits;
    const res = await importSouhaitsFromExcel(file, baseSouhaits, currentCollaborateurs);
    currentSouhaits = res.updatedSouhaits;
    summary.push(`Souhaits : ${currentSouhaits.length} souhait(s) au total (${replaceMode ? 'remplacement complet' : `${res.updatedCount} maj, ${res.createdCount} créés`})`);
  } else if (replaceMode) {
    currentSouhaits = [...existingSouhaits];
  }

  // 4. Process Logistique sheet if found
  const logSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('logist'));
  if (logSheetName) {
    const res = await importLogistiqueFromExcel(file, currentSessions);
    currentSessions = res.updatedSessions;
    summary.push(`Logistique : ${res.updatedCount} sessions synchronisées`);
  }

  // 5. Process Evaluations sheet if found
  const evalSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('eval'));
  if (evalSheetName) {
    const res = await importEvaluationsFromExcel(file, currentSessions);
    currentSessions = res.updatedSessions;
    summary.push(`Évaluations : ${res.updatedCount} sessions synchronisées`);
  }

  // 6. Process Recyclages sheet if found
  const recyclSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('recycl'));
  if (recyclSheetName) {
    const res = await importRecyclagesFromExcel(file, currentSessions);
    currentSessions = res.updatedSessions;
    summary.push(`Recyclages : ${res.updatedCount} sessions synchronisées`);
  }

  if (summary.length === 0) {
    summary.push('Aucun onglet standard détecté. Veuillez vérifier les noms des feuilles (Sessions, Collaborateurs, Souhaits, Logistique, Evaluations, Recyclages).');
  }

  return {
    sessions: currentSessions,
    collaborateurs: currentCollaborateurs,
    souhaits: currentSouhaits,
    summary
  };
};

// Backwards compatibility functions
export const downloadCollaborateursTemplate = () => {
  const sampleData = [
    {
      'ID Collaborateur': 'collab-101',
      'Matricule': 'MAT-0201',
      'Nom': 'Dupont',
      'Prénom': 'Marc',
      'Email': 'marc.dupont@entreprise.fr',
      'Genre (F/H)': 'H',
      'Statut': 'CAD',
      'Département': 'Commercial & Vente',
      'Poste': 'Attaché Commercial',
      'Date Entrée (AAAA-MM-JJ)': '2023-01-10'
    },
    {
      'ID Collaborateur': '',
      'Matricule': 'MAT-0202',
      'Nom': 'Lambert',
      'Prénom': 'Sarah',
      'Email': 'sarah.lambert@entreprise.fr',
      'Genre (F/H)': 'F',
      'Statut': 'EMP',
      'Département': 'Informatique & Tech',
      'Poste': 'Ingénieure DevOps',
      'Date Entrée (AAAA-MM-JJ)': '2022-06-01'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Collaborateurs');
  XLSX.writeFile(wb, 'modele_collaborateurs.xlsx');
};

export const downloadSouhaitsTemplate = () => {
  const sampleData = [
    {
      'ID Souhait': 'souhait-1',
      'Matricule Collaborateur': 'MAT-0102',
      'Nom & Prénom': 'Moreau Thomas',
      'Intitulé de la formation souhaitée': 'Architecture Cloud AWS & Kubernetes',
      'Domaine / Thématique': 'Informatique & Tech',
      'Niveau de Priorité': 'HAUTE',
      'Date Souhait (AAAA-MM-JJ)': '2026-03-01',
      'Statut Souhait': 'EN_ATTENTE',
      'Source Recueil': 'Forms Annuel',
      'Motivation et Objectifs': 'Optimiser l\'infrastructure de nos microservices.'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Souhaits');
  XLSX.writeFile(wb, 'modele_souhaits.xlsx');
};

export const exportPlanFormationToExcel = (
  sessions: FormationSession[],
  collaborateurs: Collaborateur[]
) => {
  exportCurrentSessionsToExcel(sessions, collaborateurs);
};

export const exportOPCOReportToExcel = (sessions: FormationSession[]) => {
  const opcoSessions = sessions.filter((s) => s.opco.declare);

  const rows = opcoSessions.map((s) => ({
    'Session': s.libelle,
    'Dates': `${s.dateDebut} au ${s.dateFin}`,
    'Organisme': s.organisme,
    'OPCO': s.opco.nomOpco,
    'N° Dossier': s.opco.numeroDossier,
    'Date Dépôt': s.opco.dateDeclaration || '',
    'Statut Dossier': s.opco.statut,
    'Mode': s.opco.subrogation ? 'Avec subrogation' : 'Sans subrogation',
    'Coût Total Formation (€)': s.coutPedagogiqueTotal + (s.fraisAnnexesTotal || 0),
    'Montant Accordé OPCO (€)': s.opco.montantPrisEnCharge + (s.opco.fraisAnnexesPrisEnCharge || 0),
    'Reste à Charge Entreprise (€)': Math.max(0, (s.coutPedagogiqueTotal + (s.fraisAnnexesTotal || 0)) - (s.opco.montantPrisEnCharge + (s.opco.fraisAnnexesPrisEnCharge || 0))),
    'Commentaires': s.opco.commentaires || ''
  }));

  const ws = createSheetWithHeaders(rows, OPCO_REPORT_HEADERS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Suivi_Financier_OPCO');
  XLSX.writeFile(wb, `Rapport_OPCO_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// Aliases for view components
export const exportLogistiqueToExcel = exportCurrentLogistiqueToExcel;
export const exportEvaluationsToExcel = exportCurrentEvaluationsToExcel;
export const exportRecyclageToExcel = exportCurrentRecyclagesToExcel;
export const importRecyclageFromExcel = importRecyclagesFromExcel;

export const parseSouhaitsFile = async (
  file: File,
  collaborateurs: Collaborateur[]
): Promise<Omit<SouhaitFormation, 'id'>[]> => {
  const res = await importSouhaitsFromExcel(file, [], collaborateurs);
  return res.updatedSouhaits.map(({ id, ...rest }) => rest);
};
