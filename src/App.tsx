import React, { useState, useEffect } from 'react';
import { ActiveTab, FormationSession, Collaborateur, SouhaitFormation } from './types';
import { 
  loadSessions, 
  saveSessions, 
  loadCollaborateurs, 
  saveCollaborateurs, 
  loadSouhaits, 
  saveSouhaits,
  resetToDefaultData
} from './utils/storage';
import { exportMasterDatabaseToExcel } from './utils/excelHelper';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SharePointSyncBanners } from './components/SharePointSyncBanners';
import { DashboardView } from './components/DashboardView';
import { SessionsView } from './components/SessionsView';
import { OpcoView } from './components/OpcoView';
import { SouhaitsView } from './components/SouhaitsView';
import { CollaborateursView } from './components/CollaborateursView';
import { RecyclageView } from './components/RecyclageView';
import { EvaluationsView } from './components/EvaluationsView';
import { CreateSessionModal } from './components/CreateSessionModal';
import { SessionDetailModal } from './components/SessionDetailModal';
import { DataRgpdGuideModal } from './components/DataRgpdGuideModal';
import { ExcelSyncModal } from './components/ExcelSyncModal';
import { RecyclingAlertItem } from './utils/analytics';

export function App() {
  // Main State
  const [sessions, setSessions] = useState<FormationSession[]>(() => loadSessions());
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>(() => loadCollaborateurs());
  const [souhaits, setSouhaits] = useState<SouhaitFormation[]>(() => loadSouhaits());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // SharePoint / Session tracking state
  const [hasImportedThisSession, setHasImportedThisSession] = useState<boolean>(() => {
    return sessionStorage.getItem('tabm_imported_session') === 'true';
  });
  const [hasExportedThisSession, setHasExportedThisSession] = useState<boolean>(() => {
    return sessionStorage.getItem('tabm_exported_session') === 'true';
  });
  const [lastImportTime, setLastImportTime] = useState<string | null>(() => {
    return sessionStorage.getItem('tabm_last_import_time') || null;
  });
  const [lastExportTime, setLastExportTime] = useState<string | null>(() => {
    return sessionStorage.getItem('tabm_last_export_time') || null;
  });
  const [showSaveReminderModal, setShowSaveReminderModal] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [prefilledSession, setPrefilledSession] = useState<Partial<FormationSession> | null>(null);
  const [selectedSession, setSelectedSession] = useState<FormationSession | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isExcelSyncModalOpen, setIsExcelSyncModalOpen] = useState(false);

  // Sync to LocalStorage on state updates
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveCollaborateurs(collaborateurs);
  }, [collaborateurs]);

  useEffect(() => {
    saveSouhaits(souhaits);
  }, [souhaits]);

  // Handler: direct 1-click export of complete master database
  const handleDirectSave = () => {
    exportMasterDatabaseToExcel(sessions, collaborateurs, souhaits);
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setHasExportedThisSession(true);
    setLastExportTime(timeStr);
    sessionStorage.setItem('tabm_exported_session', 'true');
    sessionStorage.setItem('tabm_last_export_time', timeStr);
  };

  const handleImportSuccess = () => {
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setHasImportedThisSession(true);
    setLastImportTime(timeStr);
    sessionStorage.setItem('tabm_imported_session', 'true');
    sessionStorage.setItem('tabm_last_import_time', timeStr);
  };

  // Handler: Create or Update Session
  const handleSaveSession = (savedSession: FormationSession) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === savedSession.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedSession;
        return copy;
      }
      return [savedSession, ...prev];
    });

    // If this session was created for a wish, update wish status automatically
    if (savedSession.souhaitOrigineId) {
      setSouhaits((prev) =>
        prev.map((sw) =>
          sw.id === savedSession.souhaitOrigineId
            ? {
                ...sw,
                sessionIdAssociee: savedSession.id,
                statut: savedSession.statut === 'TERMINEE' ? 'REALISE' : 'PLANIFIE'
              }
            : sw
        )
      );
    }

    setPrefilledSession(null);
  };

  const handleUpdateSession = (updatedSession: FormationSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
    if (selectedSession?.id === updatedSession.id) {
      setSelectedSession(updatedSession);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
    }
  };

  const handleDuplicateSession = (session: FormationSession) => {
    const duplicated: FormationSession = {
      ...session,
      id: `session-${Date.now()}`,
      libelle: `${session.libelle} (Copie)`,
      statut: 'A_VENIR',
      dateDebut: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      dateFin: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      logistique: {
        ...session.logistique,
        salleReservee: false,
        nomSalle: '',
        convocationEnvoyee: false,
        plateauxRepasCommandes: false
      },
      evaluationChaud: { effectuee: false },
      evaluationFroid: { ...session.evaluationFroid, effectuee: false }
    };

    setSessions((prev) => [duplicated, ...prev]);
  };

  // Handler: Collaborateurs
  const handleAddCollaborateur = (newCollab: Collaborateur) => {
    setCollaborateurs((prev) => [newCollab, ...prev]);
  };

  const handleUpdateCollaborateur = (updated: Collaborateur) => {
    setCollaborateurs((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleImportCollaborateurs = (imported: Omit<Collaborateur, 'id'>[]) => {
    setCollaborateurs((prev) => {
      const existingMatricules = new Set(prev.map((c) => c.matricule.toLowerCase()));
      const newItems: Collaborateur[] = [];
      const updatedList = prev.map((item) => {
        const found = imported.find((imp) => imp.matricule.toLowerCase() === item.matricule.toLowerCase());
        if (found) {
          return { ...item, ...found };
        }
        return item;
      });

      imported.forEach((imp, i) => {
        if (!existingMatricules.has(imp.matricule.toLowerCase())) {
          newItems.push({
            ...imp,
            id: `collab-imp-${Date.now()}-${i}`
          });
        }
      });

      return [...newItems, ...updatedList];
    });
  };

  // Handler: Souhaits
  const handleAddSouhait = (newSouhait: SouhaitFormation) => {
    setSouhaits((prev) => [newSouhait, ...prev]);
  };

  const handleUpdateSouhait = (updated: SouhaitFormation) => {
    setSouhaits((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleImportSouhaits = (imported: Omit<SouhaitFormation, 'id'>[]) => {
    const newItems: SouhaitFormation[] = imported.map((imp, idx) => ({
      ...imp,
      id: `souhait-imp-${Date.now()}-${idx}`
    }));
    setSouhaits((prev) => [...newItems, ...prev]);
  };

  // Action: Plan a session directly from a Wish
  const handlePlanSessionForWish = (wish: SouhaitFormation) => {
    setPrefilledSession({
      libelle: wish.intituleSouhait,
      type: wish.domaine.toLowerCase().includes('sécurité') ? 'Obligatoire / Sécurité' : 'Métier / Technique',
      souhaitOrigineId: wish.id,
      participants: [
        {
          collaborateurId: wish.collaborateurId,
          status: 'EN_ATTENTE'
        }
      ]
    });
    setIsCreateModalOpen(true);
  };

  // Action: Plan a session directly from a Recycling Alert
  const handlePlanRecyclingSession = (alert: RecyclingAlertItem) => {
    setPrefilledSession({
      libelle: `Recyclage - ${alert.intituleRecyclage}`,
      organisme: alert.organisme,
      type: 'Obligatoire / Sécurité',
      recyclage: {
        aRecycler: true,
        periodiciteMois: alert.periodiciteMois,
        dateRecyclagePrevue: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
      },
      participants: [
        {
          collaborateurId: alert.collaborateurId,
          status: 'EN_ATTENTE'
        }
      ]
    });
    setIsCreateModalOpen(true);
  };

  // Reset demo data helper
  const handleResetData = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données aux valeurs de démonstration ?')) {
      resetToDefaultData();
      setSessions(loadSessions());
      setCollaborateurs(loadCollaborateurs());
      setSouhaits(loadSouhaits());
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sessions={sessions}
        collaborateurs={collaborateurs}
        onOpenCreateSession={() => {
          setPrefilledSession(null);
          setIsCreateModalOpen(true);
        }}
        onResetData={handleResetData}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenExcelSync={() => setIsExcelSyncModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onDirectSave={handleDirectSave}
        onOpenSaveReminder={() => setShowSaveReminderModal(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <Header
          activeTab={activeTab}
          sessions={sessions}
          collaborateurs={collaborateurs}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onSelectSessionById={(id) => {
            const found = sessions.find((s) => s.id === id);
            if (found) setSelectedSession(found);
          }}
          onOpenGuideModal={() => setIsGuideModalOpen(true)}
          onOpenExcelSyncModal={() => setIsExcelSyncModalOpen(true)}
          onDirectSave={handleDirectSave}
        />

        {/* SharePoint Synchronization Status Banners */}
        <SharePointSyncBanners
          hasImportedThisSession={hasImportedThisSession}
          hasExportedThisSession={hasExportedThisSession}
          lastImportTime={lastImportTime}
          lastExportTime={lastExportTime}
          onOpenImportModal={() => setIsExcelSyncModalOpen(true)}
          onDirectExport={handleDirectSave}
          showSaveReminderModal={showSaveReminderModal}
          onCloseSaveReminderModal={() => setShowSaveReminderModal(false)}
        />

        {/* Scrollable View Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {activeTab === 'dashboard' && (
              <DashboardView
                sessions={sessions}
                collaborateurs={collaborateurs}
                souhaits={souhaits}
                setActiveTab={setActiveTab}
                onSelectSession={(s) => setSelectedSession(s)}
                onOpenCreateSession={() => {
                  setPrefilledSession(null);
                  setIsCreateModalOpen(true);
                }}
              />
            )}

            {activeTab === 'sessions' && (
              <SessionsView
                sessions={sessions}
                collaborateurs={collaborateurs}
                onSelectSession={(s) => setSelectedSession(s)}
                onOpenCreateSession={() => {
                  setPrefilledSession(null);
                  setIsCreateModalOpen(true);
                }}
                onDeleteSession={handleDeleteSession}
                onDuplicateSession={handleDuplicateSession}
                onUpdateSessions={(updated) => setSessions(updated)}
              />
            )}

            {activeTab === 'opco' && (
              <OpcoView
                sessions={sessions}
                onUpdateSession={handleUpdateSession}
                onSelectSession={(s) => setSelectedSession(s)}
              />
            )}

            {activeTab === 'souhaits' && (
              <SouhaitsView
                souhaits={souhaits}
                collaborateurs={collaborateurs}
                sessions={sessions}
                onUpdateSouhait={handleUpdateSouhait}
                onAddSouhait={handleAddSouhait}
                onImportSouhaits={handleImportSouhaits}
                onUpdateAllSouhaits={(updated) => setSouhaits(updated)}
                onPlanSessionForWish={handlePlanSessionForWish}
                onSelectSession={(s) => setSelectedSession(s)}
              />
            )}

            {activeTab === 'collaborateurs' && (
              <CollaborateursView
                collaborateurs={collaborateurs}
                sessions={sessions}
                souhaits={souhaits}
                onAddCollaborateur={handleAddCollaborateur}
                onUpdateCollaborateur={handleUpdateCollaborateur}
                onImportCollaborateurs={handleImportCollaborateurs}
                onSelectSession={(s) => setSelectedSession(s)}
              />
            )}

            {activeTab === 'recyclage' && (
              <RecyclageView
                sessions={sessions}
                collaborateurs={collaborateurs}
                onPlanRecyclingSession={handlePlanRecyclingSession}
                onSelectSession={(s) => setSelectedSession(s)}
                onUpdateSessions={(updated) => setSessions(updated)}
              />
            )}

            {activeTab === 'evaluations' && (
              <EvaluationsView
                sessions={sessions}
                collaborateurs={collaborateurs}
                onUpdateSession={handleUpdateSession}
                onSelectSession={(s) => setSelectedSession(s)}
                onUpdateSessions={(updated) => setSessions(updated)}
              />
            )}
          </div>
        </div>
      </main>

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPrefilledSession(null);
        }}
        onSave={handleSaveSession}
        collaborateurs={collaborateurs}
        prefilledData={prefilledSession}
      />

      {/* Session Detail & Management Modal */}
      {selectedSession && (
        <SessionDetailModal
          isOpen={Boolean(selectedSession)}
          onClose={() => setSelectedSession(null)}
          session={selectedSession}
          collaborateurs={collaborateurs}
          onUpdate={handleUpdateSession}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {/* Full App Excel Synchronization Hub Modal */}
      <ExcelSyncModal
        isOpen={isExcelSyncModalOpen}
        onClose={() => setIsExcelSyncModalOpen(false)}
        sessions={sessions}
        collaborateurs={collaborateurs}
        souhaits={souhaits}
        onUpdateSessions={(newSessions) => setSessions(newSessions)}
        onUpdateCollaborateurs={(newCollabs) => setCollaborateurs(newCollabs)}
        onUpdateSouhaits={(newSouhaits) => setSouhaits(newSouhaits)}
        onImportSuccess={handleImportSuccess}
        onExportSuccess={() => {
          const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          setHasExportedThisSession(true);
          setLastExportTime(timeStr);
          sessionStorage.setItem('tabm_exported_session', 'true');
          sessionStorage.setItem('tabm_last_export_time', timeStr);
        }}
        onResetToDefault={() => {
          const res = resetToDefaultData();
          setSessions(res.sessions);
          setCollaborateurs(res.collaborateurs);
          setSouhaits(res.souhaits);
        }}
      />

      {/* Data Autonomy & GDPR Guide for Beginners Modal */}
      <DataRgpdGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}

export default App;
