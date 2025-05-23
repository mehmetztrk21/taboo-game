import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation files / Çeviri dosyaları / ملفات الترجمة
import ar from './locales/ar.json';
import en from './locales/en.json';
import tr from './locales/tr.json';

// i18n configuration
const i18nConfig = {
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    ar: { translation: ar },
  },
  fallbackLng: 'tr',
  interpolation: {
    escapeValue: false,
  },
};

// Initialize i18n with default configuration first
i18n.use(initReactI18next).init(i18nConfig);

// Get default language code
const getDefaultLanguage = () => {
  // Supported languages
  const supportedLangs = ['tr', 'en', 'ar'];
  
  // Get device language
  const deviceLang = getLocales()[0]?.languageCode || 'tr';
  
  // Check against supported languages list
  return supportedLangs.includes(deviceLang) ? deviceLang : 'tr';
};

// Load language preference
const loadStoredLanguage = async () => {
  try {
    const storedLang = await AsyncStorage.getItem('APP_LANGUAGE');
    return storedLang || getDefaultLanguage();
  } catch (error) {
    console.error('Error loading language:', error);
    return getDefaultLanguage();
  }
};

// Store selected language
export const storeLanguage = async (langCode: string) => {
  try {
    await AsyncStorage.setItem('APP_LANGUAGE', langCode);
    await i18n.changeLanguage(langCode);
    return true;
  } catch (error) {
    console.error('Error storing language:', error);
    return false;
  }
};

// Check if RTL direction should be used (for Arabic)
export const isRTL = (langCode: string) => {
  return langCode === 'ar';
};

// Initialize i18n with stored language asynchronously
export const initializeI18n = async () => {
  const storedLang = await loadStoredLanguage();
  await i18n.changeLanguage(storedLang);
  return storedLang;
};

// Export configured i18n object
export default i18n;