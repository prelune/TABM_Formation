import { Collaborateur, FormationSession, SouhaitFormation } from '../types';

const STORAGE_KEYS = {
  COLLABORATEURS: 'forma_app_collaborateurs_v1',
  SESSIONS: 'forma_app_sessions_v1',
  SOUHAITS: 'forma_app_souhaits_v1',
  DEMO_PURGED: 'forma_app_demo_purged_v4',
};

// Predicates to identify legacy mock template entries
export const isDemoCollaborateur = (c: any): boolean => {
  if (!c || typeof c !== 'object') return false;
  const id = String(c.id || '');
  // Sequential IDs from initial template (collab-1 to collab-999, not timestamp)
  if (/^collab-([1-9]|[1-9][0-9]{1,2})$/.test(id)) return true;
  // Specific demo names from template
  const demoNames = [
    'Dubois', 'Moreau', 'Bernard', 'Petit', 'Roux', 'Leroy',
    'Fontaine', 'Garnier', 'Chevalier', 'Faure', 'Mercier', 'Blanc', 'Guerin', 'Boyer'
  ];
  if (c.nom && demoNames.includes(c.nom)) return true;
  if (c.email && (c.email.endsWith('@entreprise.fr') || c.email.endsWith('@demo.com'))) return true;
  return false;
};

export const isDemoSession = (s: any): boolean => {
  if (!s || typeof s !== 'object') return false;
  const id = String(s.id || '');
  // Sequential IDs from initial template (session-1 to session-999, not timestamp)
  if (/^session-([1-9]|[1-9][0-9]{1,2})$/.test(id)) return true;
  const libelle = String(s.libelle || '');
  if (
    libelle.includes('SST - Maintien et Actualisation') ||
    libelle.includes('Habilitation Électrique') ||
    libelle.includes('Management Transversal') ||
    libelle.includes('Excel Avancé') ||
    libelle.includes('Gestion du Stress')
  ) {
    if (id.startsWith('session-') || id.length <= 12) return true;
  }
  return false;
};

export const isDemoSouhait = (sw: any): boolean => {
  if (!sw || typeof sw !== 'object') return false;
  const id = String(sw.id || '');
  // Sequential IDs from initial template (souhait-1 to souhait-999, not timestamp)
  if (/^souhait-([1-9]|[1-9][0-9]{1,2})$/.test(id)) return true;
  return false;
};

// Automatic one-time deep purge of any legacy mock demo dataset in localStorage
const purgeLegacyMockDataIfPresent = () => {
  try {
    // Purge Collaborateurs
    const collRaw = localStorage.getItem(STORAGE_KEYS.COLLABORATEURS);
    if (collRaw) {
      const colls = JSON.parse(collRaw);
      if (Array.isArray(colls)) {
        const cleaned = colls.filter((c) => !isDemoCollaborateur(c));
        if (cleaned.length !== colls.length) {
          localStorage.setItem(STORAGE_KEYS.COLLABORATEURS, JSON.stringify(cleaned));
        }
      }
    }

    // Purge Sessions
    const sessRaw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (sessRaw) {
      const sess = JSON.parse(sessRaw);
      if (Array.isArray(sess)) {
        const cleaned = sess.filter((s) => !isDemoSession(s));
        if (cleaned.length !== sess.length) {
          localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(cleaned));
        }
      }
    }

    // Purge Souhaits
    const swRaw = localStorage.getItem(STORAGE_KEYS.SOUHAITS);
    if (swRaw) {
      const souhaits = JSON.parse(swRaw);
      if (Array.isArray(souhaits)) {
        const cleaned = souhaits.filter((sw) => !isDemoSouhait(sw));
        if (cleaned.length !== souhaits.length) {
          localStorage.setItem(STORAGE_KEYS.SOUHAITS, JSON.stringify(cleaned));
        }
      }
    }

    localStorage.setItem(STORAGE_KEYS.DEMO_PURGED, 'true');
  } catch (err) {
    console.warn('Error during legacy demo data purge', err);
  }
};

// Run purge check immediately upon module load
purgeLegacyMockDataIfPresent();

export const loadCollaborateurs = (): Collaborateur[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COLLABORATEURS);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Ensure no legacy demo items remain
    const cleaned = parsed.filter((c) => !isDemoCollaborateur(c));
    if (cleaned.length !== parsed.length) {
      saveCollaborateurs(cleaned);
    }
    return cleaned;
  } catch (err) {
    console.error('Error loading collaborateurs from localStorage', err);
    return [];
  }
};

export const saveCollaborateurs = (list: Collaborateur[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLABORATEURS, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving collaborateurs to localStorage', err);
  }
};

export const loadSessions = (): FormationSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Ensure no legacy demo items remain
    const cleaned = parsed.filter((s) => !isDemoSession(s));
    if (cleaned.length !== parsed.length) {
      saveSessions(cleaned);
    }
    return cleaned;
  } catch (err) {
    console.error('Error loading sessions from localStorage', err);
    return [];
  }
};

export const saveSessions = (list: FormationSession[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving sessions to localStorage', err);
  }
};

export const loadSouhaits = (): SouhaitFormation[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SOUHAITS);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Ensure no legacy demo items remain
    const cleaned = parsed.filter((sw) => !isDemoSouhait(sw));
    if (cleaned.length !== parsed.length) {
      saveSouhaits(cleaned);
    }
    return cleaned;
  } catch (err) {
    console.error('Error loading souhaits from localStorage', err);
    return [];
  }
};

export const saveSouhaits = (list: SouhaitFormation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SOUHAITS, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving souhaits to localStorage', err);
  }
};

export const resetToDefaultData = () => {
  localStorage.setItem(STORAGE_KEYS.COLLABORATEURS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SOUHAITS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DEMO_PURGED, 'true');
  return {
    collaborateurs: [],
    sessions: [],
    souhaits: [],
  };
};
