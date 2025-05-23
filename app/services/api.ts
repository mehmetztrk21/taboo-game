import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getLocales } from 'expo-localization';

// API instance oluşturma
const baseURL = 'https://taboo.hellfury.com';

// API için dil desteği (AsyncStorage'dan alınan aktif dil kodu)
const getLanguage = async (): Promise<string> => {
  try {
    // AsyncStorage'dan 'APP_LANGUAGE' anahtarıyla kaydedilen dil kodunu al
    const storedLanguage = await AsyncStorage.getItem('APP_LANGUAGE');
    
    if (storedLanguage) {
      return storedLanguage;
    }
    
    // Eğer saklanan bir dil yoksa cihazın dilini kullan
    const deviceLanguage = getLocales()[0]?.languageCode;
    return deviceLanguage || 'tr'; // Varsayılan dil TR
  } catch (error) {
    console.error('Dil alınırken hata:', error);
    return 'tr'; // Hata durumunda varsayılan TR
  }
};

// Son kullanılan dili saklamak için değişken (asenkron işlem tamamlanana kadar)
let cachedLanguage: string | null = null;

// Axios örneği oluşturma
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // İstek öncesi interceptor (her istekte dil kodunu ekle)
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Eğer önbelleğe alınmış dil varsa kullan, yoksa AsyncStorage'dan yeniden al
      if (!cachedLanguage) {
        cachedLanguage = await getLanguage();
      }
      
      // Her istekte dil kodunu header'a ekle
      config.headers['langCode'] = cachedLanguage;
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Yanıt interceptor
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Hata işleme
      if (error.response) {
        // Sunucudan yanıt geldi ama hata kodu
        console.error('API Hata:', error.response.status, error.response.data);
      } else if (error.request) {
        // İstek yapıldı ama yanıt yok
        console.error('Sunucu yanıt vermiyor:', error.request);
      } else {
        // İstek yapılırken hata
        console.error('İstek hatası:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Dil değiştiğinde önbelleği temizle
export const refreshLanguage = () => {
  cachedLanguage = null;
};

// API örneğini oluştur
const api = createAxiosInstance();

export default api; 