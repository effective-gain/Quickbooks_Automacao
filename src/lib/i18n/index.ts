import type { Locale } from './types'

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  'pt-BR': () => import('./dictionaries/pt-BR.json').then((m) => m.default),
  es: () => import('./dictionaries/es.json').then((m) => m.default),
}

export const locales: Locale[] = ['en', 'pt-BR', 'es']
export const defaultLocale: Locale = 'en'

export async function getDictionary(locale: Locale) {
  const load = dictionaries[locale] ?? dictionaries.en
  return load()
}

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return typeof current === 'string' ? current : path
}
