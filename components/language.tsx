'use client';

import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';
import {localiseGameMessage} from "../lib/game/message-language";

type Language = 'zh' | 'en';
const LanguageContext = createContext<{language: Language; setLanguage: (language: Language) => void}>({
  language: 'zh',
  setLanguage: () => {},
});

export function LanguageProvider({children}: {children: ReactNode}) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'zh';
    try {
      return localStorage.getItem('big-ambition:language') === 'en' ? 'en' : 'zh';
    } catch {
      return 'zh';
    }
  });
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
    try {
      localStorage.setItem('big-ambition:language', language);
    } catch {}
  }, [language]);
  return <LanguageContext.Provider value={{language, setLanguage}}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const {language, setLanguage} = useContext(LanguageContext);
  return {language, setLanguage, localiseMessage: (message: string) => localiseGameMessage(message, language), t: <T,>(zh: T, en: T): T => language === 'zh' ? zh : en};
}

export function LanguageSwitch() {
  const {language, setLanguage, t} = useLanguage();
  return <div className="language-switch" role="group" aria-label={t('選擇語言', 'Choose language')}>
    <button type="button" lang="zh-Hant" aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>繁體中文</button>
    <button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
  </div>;
}
