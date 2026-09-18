export type Gender = 'F' | 'H' | 'Autre';

export type SessionStatus = 'A_VENIR' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export type CollaborateurStatut = 'EMP' | 'CDT' | 'ATE' | 'AMT' | 'A4B' | 'CAD';

export const STATUT_LABELS: Record<CollaborateurStatut, string> = {
  EMP: 'Employé',
  CDT: 'Conducteur',
  ATE: 'Atelier',
  AMT: 'Maîtrise',
  A4B: 'Haute maîtrise',
  CAD: 'Cadre'
};

export type FormationType = 
  | 'Obligatoire' 
  | 'Développement des compétences' 
  | 'Autre'
  | 'Présentiel' 
  | 'Distanciel' 
  | 'Blended / Mixte' 
  | 'E-learning' 
  | 'Obligatoire / Sécurité' 
  | 'Métier / Technique' 
  | 'Management' 
  | 'Bureautique / Digital';

export type OPCOStatus = 
  | 'NON_DEPOSE' 
  | 'EN_INSTRUCTION' 
  | 'ACCORDE' 
  | 'EN_ATTENTE_REGLEMENT' 
  | 'REGLE_CLOTURE' 
  | 'REFUSE';

export type PresenceStatus = 'PRESENT' | 'ABSENT' | 'JUSTIFIE' | 'EN_ATTENTE';

export type SouhaitStatus = 'EN_ATTENTE' | 'PLANIFIE' | 'REALISE' | 'REPORTE';

export interface Collaborateur {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  genre: Gender;
  statut?: CollaborateurStatut; // EMP, CDT, ATE, AMT, A4B, CAD
  departement: string;
  poste: string;
  dateEntree: string; // ISO format: YYYY-MM-DD
}

export interface ParticipantPresence {
  collaborateurId: string;
  status: PresenceStatus;
  remarque?: string;
}

export interface LogistiqueSession {
  salleReservee: boolean;
  nomSalle: string;
  plateauxRepasCommandes: boolean;
  detailsRestauration: string;
  convocationEnvoyee: boolean;
  dateConvocation?: string;
  notesLogistiques?: string;
}

export interface EvaluationChaud {
  effectuee: boolean;
  dateSaisie?: string;
  noteGlobale?: number; // 1 to 5
  noteContenu?: number;
  noteFormateur?: number;
  noteOrganisation?: number;
  commentaire?: string;
  pointsForts?: string;
  axesAmelioration?: string;
  tauxRecommandation?: number;
}

export interface EvaluationFroid {
  requise: boolean;
  datePrevue: string; // 3 months after end date
  rappelEnvoye: boolean;
  dateRappel?: string;
  effectuee: boolean;
  dateRealisation?: string;
  noteImpactOperationnel?: number; // 1 to 5
  miseEnPratiqueNote?: number; // 1 to 5
  competencesMisesEnPratique?: string; // Oui complètement, Partiellement, Pas encore
  retourManager?: string;
  commentairesManager?: string;
  besoinsComplementaires?: string;
}

export interface SuiviOPCO {
  declare: boolean;
  nomOpco: string;
  numeroDossier: string;
  dateDeclaration?: string;
  subrogation: boolean; // Avec subrogation (direct) ou sans (remboursement)
  montantPrisEnCharge: number; // in €
  fraisAnnexesPrisEnCharge: number; // in €
  statut: OPCOStatus;
  commentaires?: string;
}

export interface RecyclageConfig {
  aRecycler: boolean;
  periodiciteMois: number; // ex: 24 pour SST (2 ans), 36 pour Habilitation électrique (3 ans)
  intituleRecyclage?: string;
  dateRecyclagePrevue?: string;
}

export interface FormationSession {
  id: string;
  libelle: string;
  organisme: string;
  type: FormationType;
  dateDebut: string; // YYYY-MM-DD
  dateFin: string; // YYYY-MM-DD
  horaires?: string; // e.g. "09:00 - 17:00"
  dureeHeures: number;
  dureeJours: number;
  coutPedagogiqueTotal: number; // in €
  fraisAnnexesTotal?: number; // e.g. transports/hébergement in €
  statut: SessionStatus;
  participants: ParticipantPresence[]; // IDs from Collaborateur
  logistique: LogistiqueSession;
  evaluationChaud: EvaluationChaud;
  evaluationFroid: EvaluationFroid;
  opco: SuiviOPCO;
  recyclage: RecyclageConfig;
  souhaitOrigineId?: string;
  description?: string;
  createdAt: string;
}

export interface SouhaitFormation {
  id: string;
  collaborateurId: string;
  intituleSouhait: string;
  domaine: string;
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
  dateSouhait: string; // YYYY-MM-DD
  motivation?: string;
  source: 'Forms Annuel' | 'Entretien Professionnel' | 'Demande Manager' | 'Import Excel';
  statut: SouhaitStatus;
  sessionIdAssociee?: string; // session qui comble le besoin
  dateRealisation?: string;
}

export type ActiveTab = 'dashboard' | 'sessions' | 'souhaits' | 'recyclage' | 'evaluations' | 'collaborateurs' | 'opco';
