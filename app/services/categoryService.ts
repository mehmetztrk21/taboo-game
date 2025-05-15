import api from './api';

export interface Category {
  Id: string;
  Name: string;
  LangCode: string;
  CreateDate: string;
  IsDeleted: boolean;
}

export interface CategoryResponse {
  data: Category[];
  success: boolean;
  message?: string;
}

// Kategori servislerini içeren nesne
const categoryService = {
  // Tüm kategorileri getir
  getAllCategories: async (): Promise<CategoryResponse> => {
    try {
      const response = await api.get('/category/list');
      return response.data;
    } catch (error) {
      console.error('Kategoriler alınırken hata oluştu:', error);
      throw error;
    }
  },
  
  // Belirli bir kategoriyi getir
  getCategoryById: async (categoryId: string): Promise<Category> => {
    try {
      const response = await api.post(`/category/${categoryId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Kategori alınırken hata oluştu (ID: ${categoryId}):`, error);
      throw error;
    }
  }
};

export default categoryService; 