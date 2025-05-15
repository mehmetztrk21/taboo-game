import api from './api';

export interface Word {
  Id: string;
  word: string;
  tabooWords: string[];
  categoryId: string;
}

export interface WordResponse {
  data: Word[];
  success: boolean;
  message?: string;
}

export interface WordListParams {
  categoryId?: string[];
  langCode?: string;
  limit?: number;
  page?: number;
}

// Kelime servislerini içeren nesne
const wordService = {
  // Kelimeleri getir
  getWords: async (params?: WordListParams): Promise<WordResponse> => {
    try {
      const response = await api.post('/word/list', params || {});
      return response.data;
    } catch (error) {
      console.error('Kelimeler alınırken hata oluştu:', error);
      throw error;
    }
  },
  // Belirli bir kelimeyi getir
  getWordById: async (wordId: string): Promise<Word> => {
    try {
      const response = await api.get(`/word/${wordId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Kelime alınırken hata oluştu (ID: ${wordId}):`, error);
      throw error;
    }
  }
};

export default wordService; 