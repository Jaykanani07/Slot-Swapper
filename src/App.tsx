import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { useState } from "react";
import { AuthModal } from "./components/AuthModal";
import { Dashboard } from "./components/Dashboard";
import { HomePage } from "./components/HomePage";

export default function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Authenticated>
        <Dashboard />
      </Authenticated>
      
      <Unauthenticated>
        <HomePage onOpenAuth={openAuthModal} />
      </Unauthenticated>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSwitchMode={(mode) => setAuthMode(mode)}
        />
      )}
      
      <Toaster position="top-right" />
    </div>
  );
}
