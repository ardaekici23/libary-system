import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  register: async (data: { username: string; email: string; password: string; name?: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  }
};

// ============================================================================
// USER API
// ============================================================================

export const userAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: string | number, data: { name?: string; bio?: string; avatar?: string }) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string | number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getStats: async (id: string | number) => {
    const response = await api.get(`/users/${id}/stats`);
    return response.data;
  },

  getReviews: async (id: string | number) => {
    const response = await api.get(`/users/${id}/reviews`);
    return response.data;
  },

  getReadingLists: async (id: string | number) => {
    const response = await api.get(`/users/${id}/reading-lists`);
    return response.data;
  },

  getBorrowings: async (id: string | number, status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get(`/users/${id}/borrowings`, { params });
    return response.data;
  },

  getFollowers: async (id: string | number) => {
    const response = await api.get(`/users/${id}/followers`);
    return response.data;
  },

  getFollowing: async (id: string | number) => {
    const response = await api.get(`/users/${id}/following`);
    return response.data;
  },

  follow: async (userId: string | number, followerId: string | number) => {
    const response = await api.post(`/users/${userId}/follow`, { followerId });
    return response.data;
  },

  unfollow: async (userId: string | number, followerId: string | number) => {
    const response = await api.post(`/users/${userId}/unfollow`, { followerId });
    return response.data;
  }
};

// ============================================================================
// BOOK API
// ============================================================================

export const bookAPI = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    category?: string;
    min_rating?: number;
    max_rating?: number;
    min_year?: number;
    max_year?: number;
    author?: string;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  getAllBooks: async () => {
    const response = await api.get('/books');
    return response.data.books || response.data;
  },

  getBook: async (id: number) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  getByIsbn: async (isbn: string) => {
    const response = await api.get(`/books/isbn/${isbn}`);
    return response.data;
  },

  create: async (bookData: any) => {
    const response = await api.post('/books', bookData);
    return response.data;
  },

  createBook: async (bookData: any) => {
    const response = await api.post('/books', bookData);
    return response.data;
  },

  update: async (id: string | number, bookData: any) => {
    const response = await api.put(`/books/${id}`, bookData);
    return response.data;
  },

  delete: async (id: string | number) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  import: async (bookData: any) => {
    const response = await api.post('/books/import', bookData);
    return response.data;
  },

  borrow: async (bookId: string | number, userId: string | number) => {
    const response = await api.post(`/books/${bookId}/borrow`, { userId });
    return response.data;
  },

  searchBooks: async (query: string) => {
    const response = await api.get('/search', { params: { q: query } });
    return response.data;
  }
};

// ============================================================================
// REVIEW API
// ============================================================================

export const reviewAPI = {
  getAll: async (page?: number, perPage?: number) => {
    const response = await api.get('/reviews', { params: { page, per_page: perPage } });
    return response.data;
  },

  getForBook: async (bookId: string | number) => {
    const response = await api.get(`/books/${bookId}/reviews`);
    return response.data;
  },

  create: async (bookId: string | number, data: { userId: string | number; rating: number; comment?: string }) => {
    const response = await api.post(`/books/${bookId}/reviews`, data);
    return response.data;
  },

  update: async (reviewId: string | number, data: { rating?: number; comment?: string }) => {
    const response = await api.put(`/reviews/${reviewId}`, data);
    return response.data;
  },

  delete: async (reviewId: string | number) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  }
};

// ============================================================================
// READING LIST API
// ============================================================================

export const readingListAPI = {
  getAll: async (publicOnly?: boolean) => {
    const response = await api.get('/reading-lists', { params: { public: publicOnly } });
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/reading-lists/${id}`);
    return response.data;
  },

  create: async (data: { userId: string | number; name: string; description?: string; isPublic?: boolean; bookIds?: number[] }) => {
    const response = await api.post('/reading-lists', data);
    return response.data;
  },

  update: async (id: string | number, data: { name?: string; description?: string; isPublic?: boolean }) => {
    const response = await api.put(`/reading-lists/${id}`, data);
    return response.data;
  },

  delete: async (id: string | number) => {
    const response = await api.delete(`/reading-lists/${id}`);
    return response.data;
  },

  addBook: async (listId: string | number, bookId: string | number) => {
    const response = await api.post(`/reading-lists/${listId}/books/${bookId}`);
    return response.data;
  },

  removeBook: async (listId: string | number, bookId: string | number) => {
    const response = await api.delete(`/reading-lists/${listId}/books/${bookId}`);
    return response.data;
  },

  export: async (listId: string | number, format: 'json' | 'csv' = 'json') => {
    const response = await api.get(`/export/reading-list/${listId}`, { params: { format } });
    return response.data;
  }
};

// ============================================================================
// BORROWING API
// ============================================================================

export const borrowingAPI = {
  getAll: async (status?: string) => {
    const response = await api.get('/borrowings', { params: { status } });
    return response.data;
  },

  return: async (borrowingId: string | number) => {
    const response = await api.post(`/borrowings/${borrowingId}/return`);
    return response.data;
  },

  extend: async (borrowingId: string | number) => {
    const response = await api.post(`/borrowings/${borrowingId}/extend`);
    return response.data;
  }
};

// ============================================================================
// SEARCH & CATEGORIES API
// ============================================================================

export const searchAPI = {
  search: async (params: {
    q?: string;
    category?: string;
    min_rating?: number;
    min_year?: number;
    max_year?: number;
    limit?: number;
  }) => {
    const response = await api.get('/search', { params });
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  }
};

// ============================================================================
// RECOMMENDATION API
// ============================================================================

export const recommendationAPI = {
  getRecommendations: async (userId: number, limit?: number, query?: string) => {
    const response = await api.get('/recommendations', { params: { limit, query } });
    return response.data;
  },

  getDefaultRecommendations: async () => {
    const response = await api.get('/recommendations');
    return response.data;
  }
};

// ============================================================================
// STATS API
// ============================================================================

export const statsAPI = {
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  }
};

// ============================================================================
// EXPORT API
// ============================================================================

export const exportAPI = {
  exportBooks: async (format: 'json' | 'csv' = 'json') => {
    const response = await api.get('/export/books', { params: { format } });
    return response.data;
  },

  exportReadingList: async (listId: string | number, format: 'json' | 'csv' = 'json') => {
    const response = await api.get(`/export/reading-list/${listId}`, { params: { format } });
    return response.data;
  }
};

// ============================================================================
// GOOGLE BOOKS API (External)
// ============================================================================

export const googleBooksAPI = {
  search: async (query: string) => {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
    return response.data.items?.map((item: any) => ({
      title: item.volumeInfo?.title || 'Unknown Title',
      author: item.volumeInfo?.authors?.join(', ') || 'Unknown Author',
      isbn: item.volumeInfo?.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier ||
        item.volumeInfo?.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier || '',
      description: item.volumeInfo?.description || '',
      coverImage: item.volumeInfo?.imageLinks?.thumbnail || '',
      publishedYear: parseInt(item.volumeInfo?.publishedDate?.substring(0, 4)) || 2020,
      pageCount: item.volumeInfo?.pageCount || 300,
      publisher: item.volumeInfo?.publisher || '',
      category: item.volumeInfo?.categories?.[0] || '',
      language: item.volumeInfo?.language || 'en'
    })) || [];
  },

  getByIsbn: async (isbn: string) => {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const item = response.data.items?.[0];
    if (!item) return null;

    return {
      title: item.volumeInfo?.title || 'Unknown Title',
      author: item.volumeInfo?.authors?.join(', ') || 'Unknown Author',
      isbn: isbn,
      description: item.volumeInfo?.description || '',
      coverImage: item.volumeInfo?.imageLinks?.thumbnail || '',
      publishedYear: parseInt(item.volumeInfo?.publishedDate?.substring(0, 4)) || 2020,
      pageCount: item.volumeInfo?.pageCount || 300,
      publisher: item.volumeInfo?.publisher || '',
      category: item.volumeInfo?.categories?.[0] || '',
      language: item.volumeInfo?.language || 'en'
    };
  }
};

// ============================================================================
// HEALTH API
// ============================================================================

export const healthAPI = {
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'unhealthy', error: 'API not reachable' };
    }
  }
};

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

export const getBooks = bookAPI.getAllBooks;
export const getBook = async (id: string | number) => bookAPI.getById(id);
export const createBook = bookAPI.create;
export const deleteBook = async (id: string | number) => bookAPI.delete(id);
export const updateBook = async (id: string | number, data: any) => bookAPI.update(id, data);

export const getRecommendations = async (userId: number = 1, limit?: number, query?: string) => {
  const response = await recommendationAPI.getRecommendations(userId, limit, query);
  return response;
};

export const getReadingLists = async () => readingListAPI.getAll();
export const createReadingList = async (data: any) => readingListAPI.create(data);

export default api;
