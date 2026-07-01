import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "gu" | "en";

type Ctx = {
  lang: Language;
  setLang: (l: Language) => void;
  toggle: () => void;
  t: (gu: string, en: string) => string;
};

const LanguageContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "khakhi.lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("gu");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "gu" || stored === "en") setLangState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = l;
    }
  };

  const value: Ctx = {
    lang,
    setLang,
    toggle: () => setLang(lang === "gu" ? "en" : "gu"),
    t: (gu, en) => (lang === "gu" ? gu : en),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Safe fallback (never throw during SSR before provider mounts)
    return {
      lang: "gu",
      setLang: () => undefined,
      toggle: () => undefined,
      t: (gu) => gu,
    };
  }
  return ctx;
}
