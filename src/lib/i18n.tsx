'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import frJson from '../assets/i18n/fr.json';
import arJson from '../assets/i18n/ar.json';

type Lang = 'fr' | 'ar';
type Dict = Record<string, any>;

const DICTS: Record<Lang, Dict> = { fr: frJson, ar: arJson };
const LANG_KEY = 'siipe_lang';

function lookup(dict: Dict, key: string): string | undefined {
  const parts = key.split('.');
  let node: any = dict;
  for (const p of parts) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[p];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(str: string, params?: Record<string, any>): string {
  if (!params) return str;
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : ''));
}

interface I18nContextValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem(LANG_KEY) : null) as Lang | null;
    const initial: Lang = saved === 'ar' ? 'ar' : 'fr';
    setLangState(initial);
    document.documentElement.dir = initial === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = initial;
    setReady(true);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
    try { localStorage.setItem(LANG_KEY, next); } catch { /* ignore */ }
  }, []);

  const t = useCallback((key: string, params?: Record<string, any>) => {
    const dict = DICTS[lang];
    let value = lookup(dict, key);
    if (value === undefined) value = lookup(DICTS.fr, key); // fallback to default lang, like ngx-translate's useDefaultLang
    if (value === undefined) return key; // raw key fallback, same as ngx-translate missing-key behavior
    return interpolate(value, params);
  }, [lang]);

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  const value = useMemo(() => ({ lang, dir, setLang, t }), [lang, dir, setLang, t]);

  if (!ready) return null;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
