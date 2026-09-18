import { Collaborateur, FormationSession, SouhaitFormation } from '../types';
import { INITIAL_COLLABORATEURS, INITIAL_SESSIONS, INITIAL_SOUHAITS } from '../data/mockData';

const STORAGE_KEYS = {
  COLLABORATEURS: 'forma_app_collaborateurs_v1',
  SESSIONS: 'forma_app_sessions_v1',
  SOUHAITS: 'forma_app_souhaits_v1',
};

export const loadCollaborateurs = (): Collaborateur[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COLLABORATEURS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.COLLABORATEURS, JSON.stringify(INITIAL_COLLABORATEURS));
      return INITIAL_COLLABORATEURS;
    }
    const parsed: Collaborateur[] = JSON.parse(data);
    const initialMap = new Map(INITIAL_COLLABORATEURS.map((c) => [c.id, c.statut]));
    return parsed.map((c) => ({
      ...c,
      statut: c.statut || initialMap.get(c.id) || 'EMP'
    }));
  } catch (err) {
    console.error('Error loading collaborateurs from localStorage', err);
    return INITIAL_COLLABORATEURS;
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
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
      return INITIAL_SESSIONS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading sessions from localStorage', err);
    return INITIAL_SESSIONS;
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
      localStorage.setItem(STORAGE_KEYS.SOUHAITS, JSON.stringify(INITIAL_SOUHAITS));
      return INITIAL_SOUHAITS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading souhaits from localStorage', err);
    return INITIAL_SOUHAITS;
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
  localStorage.setItem(STORAGE_KEYS.COLLABORATEURS, JSON.stringify(INITIAL_COLLABORATEURS));
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
  localStorage.setItem(STORAGE_KEYS.SOUHAITS, JSON.stringify(INITIAL_SOUHAITS));
  return {
    collaborateurs: INITIAL_COLLABORATEURS,
    sessions: INITIAL_SESSIONS,
    souhaits: INITIAL_SOUHAITS,
  };
};
