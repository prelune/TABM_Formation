import { Collaborateur, FormationSession, SouhaitFormation } from '../types';

export interface WishMatchingResult {
  totalSouhaits: number;
  souhaitsRealises: number;
  souhaitsPlanifies: number;
  souhaitsEnAttente: number;
  tauxCorrespondance: number; // in %
  souhaitsDetails: {
    souhait: SouhaitFormation;
    collaborateur?: Collaborateur;
    sessionAssociee?: FormationSession;
    estComble: boolean;
  }[];
  parDepartement: {
    departement: string;
    total: number;
    satisfaits: number;
    taux: number;
  }[];
}

export interface GenderEqualityStats {
  totalCollaborateurs: number;
  totalFemmes: number;
  totalHommes: number;
  pourcentageFemmesEntreprise: number;
  pourcentageHommesEntreprise: number;

  totalFormes: number;
  femmesFormees: number;
  hommesFormes: number;
  tauxAccesFemmes: number; // % of women in company who received/are scheduled for training
  tauxAccesHommes: number; // % of men in company who received/are scheduled for training
  
  heuresFemmes: number;
  heuresHommes: number;
  pourcentageHeuresFemmes: number;

  budgetFemmes: number;
  budgetHommes: number;
  indiceParite: number; // Ideal = 100%
}

export interface OPCOSummaryStats {
  totalBudgetFormations: number;
  totalDeclareOPCO: number;
  totalPrisEnChargeOPCO: number;
  totalFraisAnnexesOPCO: number;
  totalRecupereReel: number; // subrogation + payé
  resteAChargeEntreprise: number;
  tauxCouvertureGlobal: number; // in %
  dossiersParStatut: {
    statut: string;
    nombre: number;
    montant: number;
  }[];
  montantAvecSubrogation: number;
  montantSansSubrogation: number;
}

export interface RecyclingAlertItem {
  sessionId: string;
  sessionLibelle: string;
  organisme: string;
  collaborateurId: string;
  collaborateur: Collaborateur;
  dateDerniereFormation: string;
  dateEcheance: string;
  periodiciteMois: number;
  intituleRecyclage: string;
  joursRestants: number;
  etat: 'EXPIRE' | 'URGENT' | 'A_VENIR' | 'VALIDE';
}

export interface ColdEvaluationAlertItem {
  sessionId: string;
  sessionLibelle: string;
  dateFin: string;
  datePrevueFroid: string;
  organisme: string;
  nbParticipants: number;
  rappelEnvoye: boolean;
  joursDepuisFin: number;
  enRetard: boolean;
}

export interface LogisticsAlertItem {
  sessionId: string;
  sessionLibelle: string;
  dateDebut: string;
  nbParticipants: number;
  salleManquante: boolean;
  repasManquant: boolean;
  convocationManquante: boolean;
  joursAvantDebut: number;
}

const getDaysDiff = (targetDateStr: string, fromDate = new Date()): number => {
  const target = new Date(targetDateStr);
  const diffTime = target.getTime() - fromDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateWishMatching = (
  souhaits: SouhaitFormation[],
  sessions: FormationSession[],
  collaborateurs: Collaborateur[]
): WishMatchingResult => {
  const collabMap = new Map(collaborateurs.map((c) => [c.id, c]));
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  let souhaitsRealises = 0;
  let souhaitsPlanifies = 0;
  let souhaitsEnAttente = 0;

  const souhaitsDetails = souhaits.map((souhait) => {
    const collab = collabMap.get(souhait.collaborateurId);
    let sessionAssociee = souhait.sessionIdAssociee ? sessionMap.get(souhait.sessionIdAssociee) : undefined;
    
    // Auto-detection fallback if not explicitly linked:
    // If a session has matching title keywords or has this collaborator enrolled
    if (!sessionAssociee) {
      sessionAssociee = sessions.find((s) => {
        const hasCollab = s.participants.some((p) => p.collaborateurId === souhait.collaborateurId);
        if (!hasCollab) return false;
        const normSession = s.libelle.toLowerCase();
        const normSouhait = souhait.intituleSouhait.toLowerCase();
        return normSession.includes(normSouhait) || normSouhait.includes(normSession) ||
          (normSouhait.includes('sst') && normSession.includes('sst')) ||
          (normSouhait.includes('power bi') && normSession.includes('power bi')) ||
          (normSouhait.includes('management') && normSession.includes('management')) ||
          (normSouhait.includes('commercial') && normSession.includes('commercial')) ||
          (normSouhait.includes('caces') && normSession.includes('caces')) ||
          (normSouhait.includes('électrique') && normSession.includes('électrique'));
      });
    }

    const estComble = souhait.statut === 'REALISE' || 
                      souhait.statut === 'PLANIFIE' || 
                      (sessionAssociee !== undefined && sessionAssociee.statut !== 'ANNULEE');

    if (souhait.statut === 'REALISE' || (sessionAssociee && sessionAssociee.statut === 'TERMINEE')) {
      souhaitsRealises++;
    } else if (souhait.statut === 'PLANIFIE' || (sessionAssociee && sessionAssociee.statut === 'A_VENIR')) {
      souhaitsPlanifies++;
    } else {
      souhaitsEnAttente++;
    }

    return {
      souhait,
      collaborateur: collab,
      sessionAssociee,
      estComble
    };
  });

  const totalSouhaits = souhaits.length;
  const satisfaits = souhaitsRealises + souhaitsPlanifies;
  const tauxCorrespondance = totalSouhaits > 0 ? Math.round((satisfaits / totalSouhaits) * 100) : 0;

  // Breakdown by department
  const deptMap = new Map<string, { total: number; satisfaits: number }>();
  souhaitsDetails.forEach((item) => {
    const dept = item.collaborateur?.departement || 'Non spécifié';
    const current = deptMap.get(dept) || { total: 0, satisfaits: 0 };
    current.total++;
    if (item.estComble) current.satisfaits++;
    deptMap.set(dept, current);
  });

  const parDepartement = Array.from(deptMap.entries()).map(([departement, val]) => ({
    departement,
    total: val.total,
    satisfaits: val.satisfaits,
    taux: val.total > 0 ? Math.round((val.satisfaits / val.total) * 100) : 0
  }));

  return {
    totalSouhaits,
    souhaitsRealises,
    souhaitsPlanifies,
    souhaitsEnAttente,
    tauxCorrespondance,
    souhaitsDetails,
    parDepartement
  };
};

export const calculateGenderEquality = (
  collaborateurs: Collaborateur[],
  sessions: FormationSession[]
): GenderEqualityStats => {
  const collabMap = new Map(collaborateurs.map((c) => [c.id, c]));

  const totalCollaborateurs = collaborateurs.length;
  const totalFemmes = collaborateurs.filter((c) => c.genre === 'F').length;
  const totalHommes = collaborateurs.filter((c) => c.genre === 'H').length;

  const pourcentageFemmesEntreprise = totalCollaborateurs > 0 ? Math.round((totalFemmes / totalCollaborateurs) * 100) : 0;
  const pourcentageHommesEntreprise = totalCollaborateurs > 0 ? Math.round((totalHommes / totalCollaborateurs) * 100) : 0;

  // Find set of distinct trained collaborators
  const femmesFormeesSet = new Set<string>();
  const hommesFormesSet = new Set<string>();

  let heuresFemmes = 0;
  let heuresHommes = 0;
  let budgetFemmes = 0;
  let budgetHommes = 0;

  sessions.forEach((session) => {
    if (session.statut === 'ANNULEE') return;

    const participantsCount = session.participants.length || 1;
    const coutParParticipant = session.coutPedagogiqueTotal / participantsCount;
    const heures = session.dureeHeures;

    session.participants.forEach((p) => {
      const c = collabMap.get(p.collaborateurId);
      if (!c) return;

      if (c.genre === 'F') {
        femmesFormeesSet.add(c.id);
        heuresFemmes += heures;
        budgetFemmes += coutParParticipant;
      } else if (c.genre === 'H') {
        hommesFormesSet.add(c.id);
        heuresHommes += heures;
        budgetHommes += coutParParticipant;
      }
    });
  });

  const femmesFormees = femmesFormeesSet.size;
  const hommesFormes = hommesFormesSet.size;
  const totalFormes = femmesFormees + hommesFormes;

  const tauxAccesFemmes = totalFemmes > 0 ? Math.round((femmesFormees / totalFemmes) * 100) : 0;
  const tauxAccesHommes = totalHommes > 0 ? Math.round((hommesFormes / totalHommes) * 100) : 0;

  const totalHeures = heuresFemmes + heuresHommes;
  const pourcentageHeuresFemmes = totalHeures > 0 ? Math.round((heuresFemmes / totalHeures) * 100) : 0;

  // Parity ratio (100% means equal access rate)
  const indiceParite = tauxAccesHommes > 0 ? Math.min(100, Math.round((tauxAccesFemmes / tauxAccesHommes) * 100)) : 100;

  return {
    totalCollaborateurs,
    totalFemmes,
    totalHommes,
    pourcentageFemmesEntreprise,
    pourcentageHommesEntreprise,
    totalFormes,
    femmesFormees,
    hommesFormes,
    tauxAccesFemmes,
    tauxAccesHommes,
    heuresFemmes,
    heuresHommes,
    pourcentageHeuresFemmes,
    budgetFemmes: Math.round(budgetFemmes),
    budgetHommes: Math.round(budgetHommes),
    indiceParite
  };
};

export const calculateOPCOStats = (sessions: FormationSession[]): OPCOSummaryStats => {
  let totalBudgetFormations = 0;
  let totalDeclareOPCO = 0;
  let totalPrisEnChargeOPCO = 0;
  let totalFraisAnnexesOPCO = 0;
  let montantAvecSubrogation = 0;
  let montantSansSubrogation = 0;

  const statutCountMap = new Map<string, { count: number; montant: number }>();

  sessions.forEach((s) => {
    if (s.statut === 'ANNULEE') return;

    const totalCoutSession = s.coutPedagogiqueTotal + (s.fraisAnnexesTotal || 0);
    totalBudgetFormations += totalCoutSession;

    if (s.opco.declare) {
      totalDeclareOPCO += totalCoutSession;
      const prisEnCharge = s.opco.montantPrisEnCharge + (s.opco.fraisAnnexesPrisEnCharge || 0);
      totalPrisEnChargeOPCO += s.opco.montantPrisEnCharge;
      totalFraisAnnexesOPCO += (s.opco.fraisAnnexesPrisEnCharge || 0);

      if (s.opco.subrogation) {
        montantAvecSubrogation += prisEnCharge;
      } else {
        montantSansSubrogation += prisEnCharge;
      }

      const st = s.opco.statut;
      const current = statutCountMap.get(st) || { count: 0, montant: 0 };
      current.count++;
      current.montant += prisEnCharge;
      statutCountMap.set(st, current);
    }
  });

  const totalPrisEnChargeGlobal = totalPrisEnChargeOPCO + totalFraisAnnexesOPCO;
  const resteAChargeEntreprise = Math.max(0, totalBudgetFormations - totalPrisEnChargeGlobal);
  const tauxCouvertureGlobal = totalBudgetFormations > 0 ? Math.round((totalPrisEnChargeGlobal / totalBudgetFormations) * 100) : 0;

  const dossiersParStatut = Array.from(statutCountMap.entries()).map(([statut, val]) => ({
    statut,
    nombre: val.count,
    montant: val.montant
  }));

  return {
    totalBudgetFormations,
    totalDeclareOPCO,
    totalPrisEnChargeOPCO: totalPrisEnChargeGlobal,
    totalFraisAnnexesOPCO,
    totalRecupereReel: totalPrisEnChargeGlobal,
    resteAChargeEntreprise,
    tauxCouvertureGlobal,
    dossiersParStatut,
    montantAvecSubrogation,
    montantSansSubrogation
  };
};

export const getCollaborateurHistory = (
  collaborateurId: string,
  sessions: FormationSession[],
  souhaits: SouhaitFormation[]
) => {
  const sessionsSuivies = sessions.filter((s) =>
    s.participants.some((p) => p.collaborateurId === collaborateurId) && s.statut !== 'ANNULEE'
  );

  let totalHeures = 0;
  let totalJours = 0;
  let totalBudgetIndividuel = 0;

  sessionsSuivies.forEach((s) => {
    totalHeures += s.dureeHeures;
    totalJours += s.dureeJours;
    const nbPart = s.participants.length || 1;
    totalBudgetIndividuel += s.coutPedagogiqueTotal / nbPart;
  });

  const souhaitsCollab = souhaits.filter((sw) => sw.collaborateurId === collaborateurId);

  return {
    sessionsSuivies,
    totalSessions: sessionsSuivies.length,
    totalHeures,
    totalJours,
    totalBudgetIndividuel: Math.round(totalBudgetIndividuel),
    souhaitsCollab
  };
};

export const calculateRecyclingAlerts = (
  sessions: FormationSession[],
  collaborateurs: Collaborateur[]
): RecyclingAlertItem[] => {
  const collabMap = new Map(collaborateurs.map((c) => [c.id, c]));
  const alerts: RecyclingAlertItem[] = [];
  const now = new Date('2026-08-28'); // Reference date

  sessions.forEach((s) => {
    if (!s.recyclage.aRecycler || s.recyclage.periodiciteMois <= 0) return;

    // Calculate expiration: dateFin + periodiciteMois
    const endDate = new Date(s.dateFin);
    const expirationDate = new Date(endDate);
    expirationDate.setMonth(expirationDate.getMonth() + s.recyclage.periodiciteMois);
    const dateEcheanceStr = expirationDate.toISOString().slice(0, 10);

    const diffDays = getDaysDiff(dateEcheanceStr, now);

    let etat: 'EXPIRE' | 'URGENT' | 'A_VENIR' | 'VALIDE' = 'VALIDE';
    if (diffDays < 0) {
      etat = 'EXPIRE';
    } else if (diffDays <= 60) {
      etat = 'URGENT';
    } else if (diffDays <= 180) {
      etat = 'A_VENIR';
    }

    s.participants.forEach((p) => {
      const c = collabMap.get(p.collaborateurId);
      if (!c) return;

      alerts.push({
        sessionId: s.id,
        sessionLibelle: s.libelle,
        organisme: s.organisme,
        collaborateurId: c.id,
        collaborateur: c,
        dateDerniereFormation: s.dateFin,
        dateEcheance: dateEcheanceStr,
        periodiciteMois: s.recyclage.periodiciteMois,
        intituleRecyclage: s.recyclage.intituleRecyclage || `Recyclage ${s.libelle}`,
        joursRestants: diffDays,
        etat
      });
    });
  });

  return alerts.sort((a, b) => a.joursRestants - b.joursRestants);
};

export interface DimensionAnalyticsItem {
  key: string;
  label: string;
  effectifTotal: number;
  effectifForme: number;
  tauxAcces: number; // in %
  nombreFormations: number; // count of training participations
  heuresFormation: number;
  coutTotal: number;
  coutMoyenParForme: number;
  pctBudget: number; // in %
}

export const calculateDimensionTrainingAnalytics = (
  dimension: 'sexe' | 'departement' | 'statut',
  collaborateurs: Collaborateur[],
  sessions: FormationSession[]
): DimensionAnalyticsItem[] => {
  const collabMap = new Map<string, Collaborateur>();
  collaborateurs.forEach((c) => collabMap.set(c.id, c));

  // Determine all available segments for this dimension
  const segmentStats = new Map<string, {
    key: string;
    label: string;
    collabIds: Set<string>;
    formedCollabIds: Set<string>;
    participationsCount: number;
    heures: number;
    coutTotal: number;
  }>();

  // Helper to extract key and display label
  const getCollabSegment = (c: Collaborateur): { key: string; label: string } => {
    if (dimension === 'sexe') {
      if (c.genre === 'F') return { key: 'F', label: 'Femmes' };
      if (c.genre === 'H') return { key: 'H', label: 'Hommes' };
      return { key: 'AUTRE', label: 'Non renseigné' };
    }
    if (dimension === 'statut') {
      const st = (c.statut || 'Non renseigné').trim();
      const labels: Record<string, string> = {
        'EMP': 'Employé (EMP)',
        'CDT': 'Conducteur (CDT)',
        'ATE': 'Atelier (ATE)',
        'AMT': 'Maîtrise (AMT)',
        'A4B': 'Haute maîtrise (A4B)',
        'CAD': 'Cadre (CAD)'
      };
      return { key: st, label: labels[st] || st };
    }
    // Departement / Service
    const dep = (c.departement || 'Service Général').trim();
    return { key: dep, label: dep };
  };

  // 1. Initialize with all company collaborators
  collaborateurs.forEach((c) => {
    const { key, label } = getCollabSegment(c);
    if (!segmentStats.has(key)) {
      segmentStats.set(key, {
        key,
        label,
        collabIds: new Set<string>(),
        formedCollabIds: new Set<string>(),
        participationsCount: 0,
        heures: 0,
        coutTotal: 0
      });
    }
    segmentStats.get(key)!.collabIds.add(c.id);
  });

  // 2. Iterate through training sessions (exclude cancelled)
  let grandTotalBudget = 0;
  sessions.forEach((s) => {
    if (s.statut === 'ANNULEE') return;
    const participantsCount = s.participants.length || 1;
    const coutParParticipant = s.coutPedagogiqueTotal / participantsCount;
    const duree = s.dureeHeures;

    s.participants.forEach((p) => {
      const c = collabMap.get(p.collaborateurId);
      if (!c) return;

      const { key, label } = getCollabSegment(c);
      if (!segmentStats.has(key)) {
        segmentStats.set(key, {
          key,
          label,
          collabIds: new Set<string>(),
          formedCollabIds: new Set<string>(),
          participationsCount: 0,
          heures: 0,
          coutTotal: 0
        });
      }

      const seg = segmentStats.get(key)!;
      seg.formedCollabIds.add(c.id);
      seg.participationsCount += 1;
      seg.heures += duree;
      seg.coutTotal += coutParParticipant;
      grandTotalBudget += coutParParticipant;
    });
  });

  // 3. Compile items
  const results: DimensionAnalyticsItem[] = Array.from(segmentStats.values()).map((seg) => {
    const effectifTotal = seg.collabIds.size;
    const effectifForme = seg.formedCollabIds.size;
    const tauxAcces = effectifTotal > 0 ? Math.round((effectifForme / effectifTotal) * 100) : 0;
    const coutTotal = Math.round(seg.coutTotal);
    const coutMoyenParForme = effectifForme > 0 ? Math.round(coutTotal / effectifForme) : 0;
    const pctBudget = grandTotalBudget > 0 ? Math.round((coutTotal / grandTotalBudget) * 100) : 0;

    return {
      key: seg.key,
      label: seg.label,
      effectifTotal,
      effectifForme,
      tauxAcces,
      nombreFormations: seg.participationsCount,
      heuresFormation: seg.heures,
      coutTotal,
      coutMoyenParForme,
      pctBudget
    };
  });

  // Sort descending by cost
  return results.sort((a, b) => b.coutTotal - a.coutTotal);
};

export const calculateColdEvaluationAlerts = (
  sessions: FormationSession[]
): ColdEvaluationAlertItem[] => {
  const now = new Date('2026-08-28');
  const alerts: ColdEvaluationAlertItem[] = [];

  sessions.forEach((s) => {
    if (s.statut !== 'TERMINEE' || !s.evaluationFroid.requise || s.evaluationFroid.effectuee) {
      return;
    }

    const prevue = new Date(s.evaluationFroid.datePrevue);
    const diffDays = getDaysDiff(s.evaluationFroid.datePrevue, now);
    const fin = new Date(s.dateFin);
    const joursDepuisFin = Math.floor((now.getTime() - fin.getTime()) / (1000 * 60 * 60 * 24));

    // Due if datePrevue is in the past or within next 10 days
    if (diffDays <= 15) {
      alerts.push({
        sessionId: s.id,
        sessionLibelle: s.libelle,
        dateFin: s.dateFin,
        datePrevueFroid: s.evaluationFroid.datePrevue,
        organisme: s.organisme,
        nbParticipants: s.participants.length,
        rappelEnvoye: s.evaluationFroid.rappelEnvoye,
        joursDepuisFin,
        enRetard: diffDays < 0
      });
    }
  });

  return alerts.sort((a, b) => new Date(a.datePrevueFroid).getTime() - new Date(b.datePrevueFroid).getTime());
};

export const calculateLogisticsAlerts = (
  sessions: FormationSession[]
): LogisticsAlertItem[] => {
  const now = new Date('2026-08-28');
  const alerts: LogisticsAlertItem[] = [];

  sessions.forEach((s) => {
    if (s.statut !== 'A_VENIR') return;

    const diffDays = getDaysDiff(s.dateDebut, now);

    const salleManquante = !s.logistique.salleReservee || !s.logistique.nomSalle.trim();
    const repasManquant = !s.logistique.plateauxRepasCommandes;
    const convocationManquante = !s.logistique.convocationEnvoyee;

    if (diffDays <= 45 && (salleManquante || repasManquant || convocationManquante)) {
      alerts.push({
        sessionId: s.id,
        sessionLibelle: s.libelle,
        dateDebut: s.dateDebut,
        nbParticipants: s.participants.length,
        salleManquante,
        repasManquant,
        convocationManquante,
        joursAvantDebut: diffDays
      });
    }
  });

  return alerts.sort((a, b) => a.joursAvantDebut - b.joursAvantDebut);
};
