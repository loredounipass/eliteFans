"use client"

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../traducciones/en.json'
import es from '../traducciones/es.json'
import zh from '../traducciones/zh.json'
import ru from '../traducciones/ru.json'
import fr from '../traducciones/fr.json'
import de from '../traducciones/de.json'
import pt from '../traducciones/pt.json'

// Try to read a previously selected language from localStorage so the
// user's choice persists across reloads and sessions.
const defaultLng = 'es'
let initialLng = defaultLng
try {
  if (typeof window !== 'undefined') {
    // prefer common key used by i18next detection plugins but also accept
    // a custom 'appLang' key if present from older runs
    initialLng = localStorage.getItem('i18nextLng') || localStorage.getItem('appLang') || defaultLng
  }
} catch (err) {
  // ignore localStorage errors (e.g. strict privacy mode)
  initialLng = defaultLng
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
    en: { translation: en },
    es: { translation: es },
  zh: { translation: zh },
  ru: { translation: ru },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
    },
    lng: initialLng,
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
}

export default i18n
