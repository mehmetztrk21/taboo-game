import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// çeviri dosyaları
import ar from './locales/ar.json';
import en from './locales/en.json';
import tr from './locales/tr.json';

// varsayılan dil kodu alındı
const getDefaultLanguage = () => {
  // Desteklenen diller
  const supportedLangs = ['tr', 'en', 'ar'];
  
  // Cihazın dilini al
  const deviceLang = getLocales()[0]?.languageCode || 'tr';
  
  // Desteklenen dil listesini kontrol et
  return supportedLangs.includes(deviceLang) ? deviceLang : 'tr';
};

// Dil seçimi yükle
const loadStoredLanguage = async () => {
  try {
    const storedLang = await AsyncStorage.getItem('APP_LANGUAGE');
    return storedLang || getDefaultLanguage();
  } catch (error) {
    console.error('Dil yüklenirken hata:', error);
    return getDefaultLanguage();
  }
};

// Seçilen dili sakla
export const storeLanguage = async (langCode: string) => {
  try {
    await AsyncStorage.setItem('APP_LANGUAGE', langCode);
    await i18n.changeLanguage(langCode);
    return true;
  } catch (error) {
    console.error('Dil saklanırken hata:', error);
    return false;
  }
};

// Hangi yönün rtl olduğunu kontrol et (sağdan sola - Arapça için)
export const isRTL = (langCode: string) => {
  return langCode === 'ar';
};

// i18n yapılandırması
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

// Asenkron olarak başlangıç dilini ayarla
export const initializeI18n = async () => {
  const storedLang = await loadStoredLanguage();
  
  i18n
    .use(initReactI18next)
    .init({
      resources: i18nConfig.resources,
      fallbackLng: i18nConfig.fallbackLng,
      interpolation: i18nConfig.interpolation,
      lng: storedLang
    });
    
  return storedLang;
};

// Hazır i18n nesnesi dışa aktarıldı
export default i18n; 