import { Collaborateur, FormationSession, SouhaitFormation } from '../types';

export const INITIAL_COLLABORATEURS: Collaborateur[] = [
  {
    id: 'collab-1',
    matricule: 'MAT-0101',
    nom: 'Dubois',
    prenom: 'Camille',
    email: 'camille.dubois@entreprise.fr',
    genre: 'F',
    statut: 'CAD',
    departement: 'Ressources Humaines',
    poste: 'Chargée de Recrutement & Talents',
    dateEntree: '2022-03-15',
  },
  {
    id: 'collab-2',
    matricule: 'MAT-0102',
    nom: 'Moreau',
    prenom: 'Thomas',
    email: 'thomas.moreau@entreprise.fr',
    genre: 'H',
    statut: 'CAD',
    departement: 'Informatique & Tech',
    poste: 'Développeur Full-Stack Senior',
    dateEntree: '2021-09-01',
  },
  {
    id: 'collab-3',
    matricule: 'MAT-0103',
    nom: 'Benali',
    prenom: 'Yasmine',
    email: 'yasmine.benali@entreprise.fr',
    genre: 'F',
    statut: 'AMT',
    departement: 'Production & Atelier',
    poste: 'Chef d\'équipe Assemblage',
    dateEntree: '2020-01-10',
  },
  {
    id: 'collab-4',
    matricule: 'MAT-0104',
    nom: 'Leroy',
    prenom: 'Alexandre',
    email: 'alexandre.leroy@entreprise.fr',
    genre: 'H',
    statut: 'CAD',
    departement: 'Commercial & Vente',
    poste: 'Ingénieur Commercial Grands Comptes',
    dateEntree: '2023-05-02',
  },
  {
    id: 'collab-5',
    matricule: 'MAT-0105',
    nom: 'Rousseau',
    prenom: 'Sophie',
    email: 'sophie.rousseau@entreprise.fr',
    genre: 'F',
    statut: 'ATE',
    departement: 'Production & Atelier',
    poste: 'Technicienne Maintenance Industrielle',
    dateEntree: '2019-11-15',
  },
  {
    id: 'collab-6',
    matricule: 'MAT-0106',
    nom: 'Diallo',
    prenom: 'Mamadou',
    email: 'mamadou.diallo@entreprise.fr',
    genre: 'H',
    statut: 'EMP',
    departement: 'Logistique & Expédition',
    poste: 'Cariste & Gestionnaire Stocks',
    dateEntree: '2021-02-18',
  },
  {
    id: 'collab-7',
    matricule: 'MAT-0107',
    nom: 'Petit',
    prenom: 'Élodie',
    email: 'elodie.petit@entreprise.fr',
    genre: 'F',
    statut: 'CAD',
    departement: 'Finance & Gestion',
    poste: 'Contrôleuse de Gestion',
    dateEntree: '2022-08-20',
  },
  {
    id: 'collab-8',
    matricule: 'MAT-0108',
    nom: 'Garcia',
    prenom: 'Lucas',
    email: 'lucas.garcia@entreprise.fr',
    genre: 'H',
    statut: 'AMT',
    departement: 'Informatique & Tech',
    poste: 'Administrateur Systèmes & Réseaux',
    dateEntree: '2023-11-01',
  },
  {
    id: 'collab-9',
    matricule: 'MAT-0109',
    nom: 'Bernard',
    prenom: 'Claire',
    email: 'claire.bernard@entreprise.fr',
    genre: 'F',
    statut: 'CAD',
    departement: 'Direction & Qualité',
    poste: 'Responsable QSE (Qualité Sécurité)',
    dateEntree: '2018-06-01',
  },
  {
    id: 'collab-10',
    matricule: 'MAT-0110',
    nom: 'Fournier',
    prenom: 'Antoine',
    email: 'antoine.fournier@entreprise.fr',
    genre: 'H',
    statut: 'CAD',
    departement: 'Ressources Humaines',
    poste: 'Juriste Droit Social',
    dateEntree: '2024-01-15',
  },
  {
    id: 'collab-11',
    matricule: 'MAT-0111',
    nom: 'Lambert',
    prenom: 'Nathalie',
    email: 'nathalie.lambert@entreprise.fr',
    genre: 'F',
    statut: 'CDT',
    departement: 'Commercial & Vente',
    poste: 'Chargée de Clientèle Export',
    dateEntree: '2021-04-12',
  },
  {
    id: 'collab-12',
    matricule: 'MAT-0112',
    nom: 'Vidal',
    prenom: 'Julien',
    email: 'julien.vidal@entreprise.fr',
    genre: 'H',
    statut: 'A4B',
    departement: 'Production & Atelier',
    poste: 'Opérateur Machine CN',
    dateEntree: '2020-09-07',
  }
];

export const INITIAL_SESSIONS: FormationSession[] = [
  {
    id: 'sess-1',
    libelle: 'Sauveteur Secouriste du Travail (SST) - Maintien & Actualisation',
    organisme: 'INRS Formation Prévention',
    type: 'Obligatoire',
    dateDebut: '2026-09-15',
    dateFin: '2026-09-16',
    horaires: '08:30 - 16:30',
    dureeHeures: 14,
    dureeJours: 2,
    coutPedagogiqueTotal: 1800,
    fraisAnnexesTotal: 150,
    statut: 'A_VENIR',
    participants: [
      { collaborateurId: 'collab-3', status: 'PRESENT', remarque: 'Renouvellement diplôme' },
      { collaborateurId: 'collab-5', status: 'PRESENT' },
      { collaborateurId: 'collab-6', status: 'PRESENT' },
      { collaborateurId: 'collab-9', status: 'EN_ATTENTE' }
    ],
    logistique: {
      salleReservee: true,
      nomSalle: 'Salle Polyvalente Bâtiment C (RDC)',
      plateauxRepasCommandes: true,
      detailsRestauration: '4 formules traiteur livrées à 12h15 (1 végétarien)',
      convocationEnvoyee: true,
      dateConvocation: '2026-08-20',
      notesLogistiques: 'Mannequins et défibrillateurs pédagogiques fournis par l\'intervenant.'
    },
    evaluationChaud: {
      effectuee: false,
      noteGlobale: 0,
      noteContenu: 0,
      noteFormateur: 0,
      noteOrganisation: 0
    },
    evaluationFroid: {
      requise: true,
      datePrevue: '2026-12-16',
      rappelEnvoye: false,
      effectuee: false
    },
    opco: {
      declare: true,
      nomOpco: 'OPCO 2i / Atlas',
      numeroDossier: 'DOS-2026-98124',
      dateDeclaration: '2026-08-10',
      subrogation: true,
      montantPrisEnCharge: 1600,
      fraisAnnexesPrisEnCharge: 100,
      statut: 'ACCORDE',
      commentaires: 'Accord cadre prévention sécurité validé par l\'OPCO.'
    },
    recyclage: {
      aRecycler: true,
      periodiciteMois: 24,
      intituleRecyclage: 'MAC SST (Maintien des Acquis)'
    },
    description: 'Actualisation des compétences de sauveteur secouriste du travail selon les référentiels nationaux.',
    createdAt: '2026-08-01'
  },
  {
    id: 'sess-2',
    libelle: 'Pilotage de Projets & Tableaux de Bord avec Power BI Avancé',
    organisme: 'DataSkills Academy',
    type: 'Développement des compétences',
    dateDebut: '2026-09-24',
    dateFin: '2026-09-25',
    horaires: '09:00 - 17:30',
    dureeHeures: 14,
    dureeJours: 2,
    coutPedagogiqueTotal: 2400,
    fraisAnnexesTotal: 0,
    statut: 'A_VENIR',
    participants: [
      { collaborateurId: 'collab-2', status: 'PRESENT' },
      { collaborateurId: 'collab-7', status: 'PRESENT' },
      { collaborateurId: 'collab-8', status: 'PRESENT' }
    ],
    logistique: {
      salleReservee: true,
      nomSalle: 'Salle Informatique Magellan (12 PC)',
      plateauxRepasCommandes: false,
      detailsRestauration: 'Déjeuner libre tickets restaurant',
      convocationEnvoyee: false,
      notesLogistiques: 'Vérifier installation Power BI Desktop version 2026.'
    },
    evaluationChaud: {
      effectuee: false,
      noteGlobale: 0,
      noteContenu: 0,
      noteFormateur: 0,
      noteOrganisation: 0
    },
    evaluationFroid: {
      requise: true,
      datePrevue: '2026-12-25',
      rappelEnvoye: false,
      effectuee: false
    },
    opco: {
      declare: true,
      nomOpco: 'OPCO Atlas',
      numeroDossier: 'ATLAS-DIGIT-4519',
      dateDeclaration: '2026-08-14',
      subrogation: false,
      montantPrisEnCharge: 1900,
      fraisAnnexesPrisEnCharge: 0,
      statut: 'EN_INSTRUCTION',
      commentaires: 'Dossier déposé sur le portail MyAtlas en attente d\'accord définitif.'
    },
    recyclage: {
      aRecycler: false,
      periodiciteMois: 0
    },
    description: 'Modélisation DAX avancée, création de datamarts et publication sécurisée sur Power BI Service.',
    createdAt: '2026-08-05'
  },
  {
    id: 'sess-3',
    libelle: 'Habilitation Électrique B1V - B2V - BC - BR',
    organisme: 'Apave Certification',
    type: 'Obligatoire',
    dateDebut: '2026-05-18',
    dateFin: '2026-05-20',
    horaires: '08:30 - 17:00',
    dureeHeures: 21,
    dureeJours: 3,
    coutPedagogiqueTotal: 3100,
    fraisAnnexesTotal: 200,
    statut: 'TERMINEE',
    participants: [
      { collaborateurId: 'collab-5', status: 'PRESENT' },
      { collaborateurId: 'collab-12', status: 'PRESENT' }
    ],
    logistique: {
      salleReservee: true,
      nomSalle: 'Centre APAVE Lyon Est',
      plateauxRepasCommandes: true,
      detailsRestauration: 'Inclus dans le forfait organisme',
      convocationEnvoyee: true,
      dateConvocation: '2026-05-02',
      notesLogistiques: 'EPI complets obligatoires apportés par les agents.'
    },
    evaluationChaud: {
      effectuee: true,
      dateSaisie: '2026-05-20',
      noteGlobale: 4.8,
      noteContenu: 5,
      noteFormateur: 4.8,
      noteOrganisation: 4.6,
      commentaire: 'Excellente session pratique sur armoires réelles. Formateur très expérimenté.',
      pointsForts: 'Mises en situation d\'urgence, explications NF C 18-510 limpides.',
      axesAmelioration: 'Plus de temps sur la consignation haute tension.'
    },
    evaluationFroid: {
      requise: true,
      datePrevue: '2026-08-20',
      rappelEnvoye: false,
      effectuee: false,
      noteImpactOperationnel: 0,
      competencesMisesEnPratique: 'En attente d\'évaluation manager',
      retourManager: ''
    },
    opco: {
      declare: true,
      nomOpco: 'OPCO 2i',
      numeroDossier: 'OP2I-ELEC-8821',
      dateDeclaration: '2026-04-28',
      subrogation: true,
      montantPrisEnCharge: 2800,
      fraisAnnexesPrisEnCharge: 150,
      statut: 'REGLE_CLOTURE',
      commentaires: 'Paiement direct reçu par l\'Apave.'
    },
    recyclage: {
      aRecycler: true,
      periodiciteMois: 36,
      intituleRecyclage: 'Recyclage Habilitation Électrique (3 ans)'
    },
    description: 'Formation réglementaire obligatoire selon la norme NF C 18-510 pour interventions en basse tension.',
    createdAt: '2026-04-15'
  },
  {
    id: 'sess-4',
    libelle: 'Management Hybride & Posture de Manager Coach',
    organisme: 'Cegos France',
    type: 'Développement des compétences',
    dateDebut: '2026-06-10',
    dateFin: '2026-06-11',
    horaires: '09:00 - 17:00',
    dureeHeures: 14,
    dureeJours: 2,
    coutPedagogiqueTotal: 2600,
    fraisAnnexesTotal: 180,
    statut: 'TERMINEE',
    participants: [
      { collaborateurId: 'collab-1', status: 'PRESENT' },
      { collaborateurId: 'collab-3', status: 'PRESENT' },
      { collaborateurId: 'collab-9', status: 'PRESENT' }
    ],
    logistique: {
      salleReservee: true,
      nomSalle: 'Salle du Conseil A',
      plateauxRepasCommandes: true,
      detailsRestauration: 'Traiteur Bio & Éthique 3 repas',
      convocationEnvoyee: true,
      dateConvocation: '2026-05-25',
      notesLogistiques: 'Support projeté + paperboard et post-its design thinking.'
    },
    evaluationChaud: {
      effectuee: true,
      dateSaisie: '2026-06-11',
      noteGlobale: 4.5,
      noteContenu: 4.5,
      noteFormateur: 4.7,
      noteOrganisation: 4.3,
      commentaire: 'Outils concrets immédiatement applicables pour fixer des objectifs en télétravail.',
      pointsForts: 'Jeux de rôles bienveillants et feedback individuel.',
      axesAmelioration: 'Approfondir la gestion des conflits à distance.'
    },
    evaluationFroid: {
      requise: true,
      datePrevue: '2026-09-10',
      rappelEnvoye: false,
      effectuee: false
    },
    opco: {
      declare: true,
      nomOpco: 'AKTO',
      numeroDossier: 'AKTO-MGT-2026-14',
      dateDeclaration: '2026-05-12',
      subrogation: false,
      montantPrisEnCharge: 2100,
      fraisAnnexesPrisEnCharge: 120,
      statut: 'ACCORDE',
      commentaires: 'En attente de transmission de la facture acquittée et des émargements.'
    },
    recyclage: {
      aRecycler: false,
      periodiciteMois: 0
    },
    description: 'Développer son leadership, animer une équipe à distance et conduire des entretiens one-to-one motivants.',
    createdAt: '2026-05-01'
  },
  {
    id: 'sess-5',
    libelle: 'Négociation Commerciale Complexe & B2B',
    organisme: 'Booster Academy',
    type: 'Développement des compétences',
    dateDebut: '2026-10-08',
    dateFin: '2026-10-09',
    horaires: '09:00 - 17:00',
    dureeHeures: 14,
    dureeJours: 2,
    coutPedagogiqueTotal: 2200,
    fraisAnnexesTotal: 80,
    statut: 'A_VENIR',
    participants: [
      { collaborateurId: 'collab-4', status: 'PRESENT' },
      { collaborateurId: 'collab-11', status: 'PRESENT' }
    ],
    logistique: {
      salleReservee: false,
      nomSalle: '',
      plateauxRepasCommandes: false,
      detailsRestauration: '',
      convocationEnvoyee: false,
      notesLogistiques: 'Prévoir réservation de la salle de créativité Bâtiment B.'
    },
    evaluationChaud: {
      effectuee: false,
      noteGlobale: 0,
      noteContenu: 0,
      noteFormateur: 0,
      noteOrganisation: 0
    },
    evaluationFroid: {
      requise: true,
      datePrevue: '2027-01-09',
      rappelEnvoye: false,
      effectuee: false
    },
    opco: {
      declare: false,
      nomOpco: '',
      numeroDossier: '',
      subrogation: false,
      montantPrisEnCharge: 0,
      fraisAnnexesPrisEnCharge: 0,
      statut: 'NON_DEPOSE',
      commentaires: 'Devis reçu, convention signée à envoyer avant le 15 septembre.'
    },
    recyclage: {
      aRecycler: false,
      periodiciteMois: 0
    },
    description: 'Techniques de défense des marges, traitement des objections tarifaires et closing stratégique.',
    createdAt: '2026-08-18'
  },
  {
    id: 'sess-6',
    libelle: 'Conduite de Chariot Élévateur CACES R489 Catégories 1A - 3 - 5',
    organisme: 'Dekra Formation',
    type: 'Obligatoire',
    dateDebut: '2024-09-02',
    dateFin: '2024-09-05',
    horaires: '08:00 - 16:30',
    dureeHeures: 28,
    dureeJours: 4,
    coutPedagogiqueTotal: 1950,
    fraisAnnexesTotal: 100,
    statut: 'TERMINEE',
    participants: [
      { collaborateurId: 'collab-6', status: 'PRESENT' }
    ],
    logistique: {
      salleReservee: true,
      nomSalle: 'Plateau technique Dekra Vénissieux',
      plateauxRepasCommandes: true,
      detailsRestauration: 'Inclus au centre',
      convocationEnvoyee: true,
      dateConvocation: '2024-08-15'
    },
    evaluationChaud: {
      effectuee: true,
      dateSaisie: '2024-09-05',
      noteGlobale: 4.9,
      noteContenu: 4.8,
      noteFormateur: 5,
      noteOrganisation: 4.9,
      commentaire: 'Examen réussi avec félicitations du testeur certifié.'
    },
    evaluationFroid: {
      requise: true,
      datePrevue: '2024-12-05',
      rappelEnvoye: true,
      effectuee: true,
      dateRealisation: '2024-12-10',
      noteImpactOperationnel: 5,
      competencesMisesEnPratique: 'Totalement, circulation quotidienne en entrepôt',
      retourManager: 'Zéro incident, parfaite maîtrise des consignes de sécurité.'
    },
    opco: {
      declare: true,
      nomOpco: 'OPCO 2i',
      numeroDossier: 'CACES-2024-099',
      dateDeclaration: '2024-08-10',
      subrogation: true,
      montantPrisEnCharge: 1950,
      fraisAnnexesPrisEnCharge: 100,
      statut: 'REGLE_CLOTURE'
    },
    recyclage: {
      aRecycler: true,
      periodiciteMois: 24,
      intituleRecyclage: 'Recyclage CACES R489'
    },
    description: 'Certificat d\'aptitude à la conduite en sécurité des chariots automoteurs.',
    createdAt: '2024-08-01'
  },
  {
    id: 'sess-7',
    libelle: 'Sensibilisation aux Cyber-Risques & Sécurité des Données',
    organisme: 'Global Cyber Training',
    type: 'Développement des compétences',
    dateDebut: '2026-04-10',
    dateFin: '2026-04-10',
    horaires: '09:00 - 17:00',
    dureeHeures: 7,
    dureeJours: 1,
    coutPedagogiqueTotal: 1200,
    fraisAnnexesTotal: 0,
    statut: 'TERMINEE',
    participants: [
      { collaborateurId: 'collab-2', status: 'PRESENT' },
      { collaborateurId: 'collab-8', status: 'PRESENT' }
    ],
    logistique: {
      salleReservee: true,
      nomSalle: 'Salle Magellan',
      plateauxRepasCommandes: false,
      detailsRestauration: 'Libre',
      convocationEnvoyee: true,
      dateConvocation: '2026-03-25'
    },
    evaluationChaud: {
      effectuee: true,
      dateSaisie: '2026-04-10',
      noteGlobale: 2.8,
      noteContenu: 3.0,
      noteFormateur: 2.5,
      noteOrganisation: 3.0,
      commentaire: 'Intervenant trop théorique, peu d\'exemples pratiques adaptés à notre environnement.',
      pointsForts: 'Support de cours complet.',
      axesAmelioration: 'Pédagogie à revoir, pas assez d\'interactivité.'
    },
    evaluationFroid: {
      requise: true,
      datePrevue: '2026-07-10',
      rappelEnvoye: true,
      effectuee: true,
      dateRealisation: '2026-07-15',
      noteImpactOperationnel: 3,
      competencesMisesEnPratique: 'Application modérée',
      retourManager: 'Sensibilisation utile mais besoin d\'un atelier plus pratique.'
    },
    opco: {
      declare: true,
      nomOpco: 'OPCO Atlas',
      numeroDossier: 'ATLAS-CYBER-2026',
      dateDeclaration: '2026-03-10',
      subrogation: false,
      montantPrisEnCharge: 900,
      fraisAnnexesPrisEnCharge: 0,
      statut: 'REGLE_CLOTURE'
    },
    recyclage: {
      aRecycler: false,
      periodiciteMois: 0
    },
    description: 'Sensibilisation aux réflexes de sécurité informatique et détection du phishing.',
    createdAt: '2026-03-01'
  }
];

export const INITIAL_SOUHAITS: SouhaitFormation[] = [
  {
    id: 'souhait-1',
    collaborateurId: 'collab-2',
    intituleSouhait: 'Pilotage de Projets & Tableaux de Bord avec Power BI Avancé',
    domaine: 'Digital & BI',
    priorite: 'HAUTE',
    dateSouhait: '2026-02-15',
    motivation: 'Besoin d\'automatiser le reporting de performance IT pour la direction.',
    source: 'Forms Annuel',
    statut: 'PLANIFIE',
    sessionIdAssociee: 'sess-2'
  },
  {
    id: 'souhait-2',
    collaborateurId: 'collab-7',
    intituleSouhait: 'Modélisation financière & Power BI',
    domaine: 'Finance & BI',
    priorite: 'HAUTE',
    dateSouhait: '2026-02-20',
    motivation: 'Modernisation des budgets mensuels et modélisation de trésorerie.',
    source: 'Forms Annuel',
    statut: 'PLANIFIE',
    sessionIdAssociee: 'sess-2'
  },
  {
    id: 'souhait-3',
    collaborateurId: 'collab-4',
    intituleSouhait: 'Négociation Commerciale Complexe & B2B',
    domaine: 'Commerce',
    priorite: 'HAUTE',
    dateSouhait: '2026-03-01',
    motivation: 'Augmenter le taux de transformation sur les appels d\'offres > 100k€.',
    source: 'Entretien Professionnel',
    statut: 'PLANIFIE',
    sessionIdAssociee: 'sess-5'
  },
  {
    id: 'souhait-4',
    collaborateurId: 'collab-1',
    intituleSouhait: 'Management d\'équipe & Coaching',
    domaine: 'Management',
    priorite: 'MOYENNE',
    dateSouhait: '2026-01-20',
    motivation: 'Accompagner les nouveaux alternants RH avec les bonnes méthodes.',
    source: 'Forms Annuel',
    statut: 'REALISE',
    sessionIdAssociee: 'sess-4',
    dateRealisation: '2026-06-11'
  },
  {
    id: 'souhait-5',
    collaborateurId: 'collab-3',
    intituleSouhait: 'Maintien des Compétences SST Secourisme',
    domaine: 'Sécurité & Prévention',
    priorite: 'HAUTE',
    dateSouhait: '2026-03-10',
    motivation: 'Maintien de ma carte SST requise pour mon poste en atelier.',
    source: 'Forms Annuel',
    statut: 'PLANIFIE',
    sessionIdAssociee: 'sess-1'
  },
  {
    id: 'souhait-6',
    collaborateurId: 'collab-8',
    intituleSouhait: 'Cybersécurité & Hardening Serveurs Linux',
    domaine: 'Informatique & Sécurité',
    priorite: 'HAUTE',
    dateSouhait: '2026-04-05',
    motivation: 'Mise en conformité directive NIS2 et audit de sécurité interne.',
    source: 'Demande Manager',
    statut: 'EN_ATTENTE'
  },
  {
    id: 'souhait-7',
    collaborateurId: 'collab-10',
    intituleSouhait: 'Actualité Droit Social & Négociation d\'Accords',
    domaine: 'Juridique / RH',
    priorite: 'MOYENNE',
    dateSouhait: '2026-05-12',
    motivation: 'Préparation des prochaines NAO et mise à jour de la convention collective.',
    source: 'Forms Annuel',
    statut: 'EN_ATTENTE'
  },
  {
    id: 'souhait-8',
    collaborateurId: 'collab-11',
    intituleSouhait: 'Anglais des Affaires & Pitch Commercial International',
    domaine: 'Langues & International',
    priorite: 'MOYENNE',
    dateSouhait: '2026-04-18',
    motivation: 'Développement de nouveaux prospects en Allemagne et Scandinavie.',
    source: 'Forms Annuel',
    statut: 'EN_ATTENTE'
  },
  {
    id: 'souhait-9',
    collaborateurId: 'collab-12',
    intituleSouhait: 'Programmation Commandes Numériques Heidenhain',
    domaine: 'Technique Industrielle',
    priorite: 'HAUTE',
    dateSouhait: '2026-03-25',
    motivation: 'Arrivée des nouvelles fraiseuses 5 axes à l\'atelier.',
    source: 'Demande Manager',
    statut: 'EN_ATTENTE'
  }
];
