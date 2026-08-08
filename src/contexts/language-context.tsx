import { createContext, useEffect, useState } from "react";
import { translations, type Lang, type Translations } from "@/lib/translations";

interface LanguageContextType {
  lang: Lang;
  t: typeof translations.en | typeof translations.ar;
  toggleLang: () => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  t: translations.en as typeof translations.en | typeof translations.ar,
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("lang");
    return saved === "ar" || saved === "en" ? saved : "en";
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
  }, [lang, t.dir]);

  function toggleLang() {
    setLang(prev => (prev === "en" ? "ar" : "en"));
  }

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
