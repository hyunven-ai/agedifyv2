"use client";
import { ThemeProvider } from '@/context/ThemeContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import TrackingScripts from '@/components/TrackingScripts';
import ChatWidget from '@/components/ChatWidget';
import DevToolsGuard from '@/components/DevToolsGuard';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <WishlistProvider>
            <AuthProvider>
              <TrackingScripts />
              <DevToolsGuard />
              {children}
              <ChatWidget />
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </WishlistProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
