import React, { useState, useEffect } from 'react';
import { bookAPI, recommendationAPI } from '../services/api';

const BookList: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBooks();
    loadRecommendations(1); // Demo user ID 1
  }, []);

  const loadBooks = async () => {
    try {
      const data = await bookAPI.getAllBooks();
      setBooks(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading books:', error);
      setLoading(false);
    }
  };

  const loadRecommendations = async (userId: number) => {
    try {
      const data = await recommendationAPI.getRecommendations(userId);
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadBooks();
      return;
    }
    
    try {
      const data = await bookAPI.searchBooks(searchQuery);
      setBooks(data);
    } catch (error) {
      console.error('Error searching books:', error);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading books...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">📚 Library Management System</h1>
      
      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books by title, author, or category..."
            className="flex-grow p-3 border border-gray-300 rounded-lg"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              loadBooks();
            }}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">✨ Recommended For You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendations.map((book) => (
              <div key={book.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-lg mb-2">{book.title}</h3>
                <p className="text-gray-600 mb-2">by {book.author}</p>
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {book.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Books Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">All Books ({books.length})</h2>
          <button
            onClick={() => loadBooks()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Refresh
          </button>
        </div>
        
        {books.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No books found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div key={book.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-xl mb-2">{book.title}</h3>
                <p className="text-gray-700 mb-2"><strong>Author:</strong> {book.author}</p>
                <p className="text-gray-600 mb-3"><strong>Category:</strong> {book.category}</p>
                {book.description && (
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3">{book.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">ISBN: {book.isbn || 'N/A'}</span>
                  <button className="text-blue-600 hover:text-blue-800 font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookList;
