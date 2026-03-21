'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Locale, Dictionary } from './types'
import { defaultLocale, getNestedValue } from '.'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string>) => string
  dictionary: Dictionary
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children, initialDictionary, initialLocale }: {
  children: ReactNode
  initialDictionary: Dictionary
  initialLocale: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [dictionary, setDictionary] = useState<Dictionary>(initialDictionary)

  const setLocale = useCallback(async (newLocale: Locale) => {
    const dict = await import(`./dictionaries/${newLocale}.json`).then(m => m.default)
    setDictionary(dict)
    setLocaleState(newLocale)
    document.documentElement.lang = newLocale
    localStorage.setItem('locale', newLocale)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved && saved !== initialLocale) {
      setLocale(saved)
    }
  }, [initialLocale, setLocale])

  const t = useCallback((key: string, params?: Record<string, string>) => {
    let value = getNestedValue(dictionary as Record<string, unknown>, key)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, v)
      })
    }
    return value
  }, [dictionary])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dictionary }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}
