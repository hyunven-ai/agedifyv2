"use client";
import { useState, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { getPublicSEOSettings } from '../lib/api';

const ChatWidget = () => {
  const [settings, setSettings] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getPublicSEOSettings();
        setSettings(response.data);
      } catch (error) {
        console.error('Error loading chat widget settings:', error);
      }
    };
    loadSettings();

    // Show widget after a short delay
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Don't render if widget is disabled or no WhatsApp/Telegram configured
  if (!settings?.chat_widget_enabled) return null;
  if (!settings?.whatsapp_number && !settings?.telegram_username) return null;

  const position = settings?.chat_widget_position || 'right';
  const positionClass = position === 'left' ? 'left-6' : 'right-6';

  const openWhatsApp = () => {
    const phone = settings.whatsapp_number.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(settings.whatsapp_message || 'Halo, saya tertarik dengan domain di Agedify');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const openTelegram = () => {
    const username = settings.telegram_username.replace('@', '');
    window.open(`https://t.me/${username}`, '_blank');
  };

  return (
    <div 
      className={`fixed bottom-24 ${positionClass} z-[9999] transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
      data-testid="chat-widget"
    >
      {/* Chat Options Panel */}
      {isOpen && (
        <div 
          className="absolute bottom-16 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 mb-2 w-72 animate-in slide-in-from-bottom-2 duration-200"
          style={{ 
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Chat dengan Kami</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pilih platform chat</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              aria-label="Close chat widget"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="space-y-3">
            {/* WhatsApp Button */}
            {settings.whatsapp_number && (
              <button
                onClick={openWhatsApp}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25"
                data-testid="whatsapp-btn"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold">WhatsApp</div>
                  <div className="text-xs text-white/80">Chat langsung</div>
                </div>
                <Send className="w-5 h-5 ml-auto" />
              </button>
            )}

            {/* Telegram Button */}
            {settings.telegram_username && (
              <button
                onClick={openTelegram}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
                data-testid="telegram-btn"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold">Telegram</div>
                  <div className="text-xs text-white/80">@{settings.telegram_username.replace('@', '')}</div>
                </div>
                <Send className="w-5 h-5 ml-auto" />
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-center text-slate-400">Respon cepat dalam jam kerja</p>
          </div>
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen 
            ? 'bg-slate-700 dark:bg-slate-600 rotate-0' 
            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
        }`}
        style={{ 
          boxShadow: isOpen 
            ? '0 4px 20px rgba(0,0,0,0.3)' 
            : '0 4px 20px rgba(34,197,94,0.4)'
        }}
        aria-label={isOpen ? 'Close chat options' : 'Open chat options'}
        data-testid="chat-toggle-btn"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Pulse Animation when closed */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 pointer-events-none"></span>
      )}
    </div>
  );
};

export default ChatWidget;
