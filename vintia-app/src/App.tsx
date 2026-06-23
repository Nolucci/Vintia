import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import AuthScreen from './screens/AuthScreen';
import VosVentesScreen from './screens/VosVentesScreen';
import { TutorialProvider, useTutorial } from './contexts/TutorialContext';
import { LanguageProvider, useLang } from './contexts/LanguageContext';
import TutorialOverlay from './components/TutorialOverlay';

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { isFirstVisit, startTutorial } = useTutorial();
  const { t } = useLang();

  useEffect(() => {
    // Récupère la session existante au démarrage
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Écoute les changements de session (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Lancer automatiquement le tutoriel après connexion si première visite
  useEffect(() => {
    if (session && isFirstVisit) {
      // Petite temporisation pour s'assurer que l'UI est prête
      const timer = setTimeout(() => {
        startTutorial(t);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [session, isFirstVisit, startTutorial, t]);

  if (loading) return null;

  if (!session) {
    return <AuthScreen onAuthSuccess={() => { /* géré par onAuthStateChange */ }} />;
  }

  const handleDeleteAccount = async () => {
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) throw new Error(error.message);
    await supabase.auth.signOut();
  };

  return (
    <>
      <VosVentesScreen
        userId={session.user.id}
        userMeta={session.user.user_metadata as { name?: string; avatar_initials?: string; avatar_url?: string }}
        onLogout={() => supabase.auth.signOut()}
        onDeleteAccount={handleDeleteAccount}
      />
      <TutorialOverlay />
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <TutorialProvider>
        <AppContent />
      </TutorialProvider>
    </LanguageProvider>
  );
}

export default App;
