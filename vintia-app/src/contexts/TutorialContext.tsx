import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Item } from '../types';
import type { Translations } from './LanguageContext';

export const TUTORIAL_MOCK_PREFIX = 'tutorial_mock_';

function getMockItems(t: Translations): Item[] {
  return [
    {
      id: `${TUTORIAL_MOCK_PREFIX}1`,
      transaction: 'achat',
      type: 'electronique',
      titre: t.tutorialItem1Title,
      url: '',
      description: t.tutorialItem1Desc,
      prixAchat: 320,
      prixVente: 480,
      prixVendu: null,
      marge: null,
      compareAvec: [`${TUTORIAL_MOCK_PREFIX}2`],
      prixIACible: 460,
      recommandations: t.tutorialItem1Reco,
      analyseIA: JSON.stringify({
        recommendedPrice: '460',
        suggestedBuyPrice: '310',
        demand: 'Forte',
        tips: [t.tutorialItem1Reco],
        marketInsights: t.tutorialItem1Insight,
      }),
      platformId: null,
      dateAjout: new Date().toISOString(),
    },
    {
      id: `${TUTORIAL_MOCK_PREFIX}2`,
      transaction: 'vente',
      type: 'electronique',
      titre: t.tutorialItem2Title,
      url: '',
      description: t.tutorialItem2Desc,
      prixAchat: 210,
      prixVente: 350,
      prixVendu: 340,
      marge: 130,
      compareAvec: [],
      prixIACible: null,
      recommandations: '',
      analyseIA: undefined,
      platformId: null,
      dateAjout: new Date().toISOString(),
    },
  ];
}

interface AppApi {
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setSelectedPlatformId: React.Dispatch<React.SetStateAction<string | null>>;
}

interface TutorialContextType {
  isFirstVisit: boolean;
  markTutorialSeen: () => void;
  resetTutorial: () => void;
  startTutorial: (t: Translations) => void;
  isTutorialActive: boolean;
  setIsTutorialActive: (active: boolean) => void;
  registerAppApi: (api: AppApi) => void;
  cleanupMocks: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const STORAGE_KEY = 'vintia_tutorial_completed';

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'true');
  const appApiRef = useRef<AppApi | null>(null);

  const markTutorialSeen = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsFirstVisit(false);
  }, []);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  const registerAppApi = useCallback((api: AppApi) => {
    appApiRef.current = api;
  }, []);

  const startTutorial = useCallback((t: Translations) => {
    const api = appApiRef.current;
    if (api) {
      api.setSelectedPlatformId(null);
      api.setItems(prev => {
        const withoutMocks = prev.filter(i => !i.id.startsWith(TUTORIAL_MOCK_PREFIX));
        return [...getMockItems(t), ...withoutMocks];
      });
    }
    setIsTutorialActive(true);
  }, []);

  const cleanupMocks = useCallback(() => {
    appApiRef.current?.setItems(prev => prev.filter(i => !i.id.startsWith(TUTORIAL_MOCK_PREFIX)));
  }, []);

  return (
    <TutorialContext.Provider value={{
      isFirstVisit,
      markTutorialSeen,
      resetTutorial,
      startTutorial,
      isTutorialActive,
      setIsTutorialActive,
      registerAppApi,
      cleanupMocks,
    }}>
      {children}
    </TutorialContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
