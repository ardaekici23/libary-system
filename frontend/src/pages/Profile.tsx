import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { userAPI, borrowingAPI, exportAPI } from '@/services/api';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface UserStats {
  reviewsCount: number;
  listsCount: number;
  borrowedCount: number;
  currentlyBorrowed: number;
  followersCount: number;
  followingCount: number;
}

interface Borrowing {
  id: string;
  bookId: string;
  borrowedAt: string;
  dueDate: string;
  status: string;
  book: {
    title: string;
    author: string;
    coverImage: string;
  };
}

export function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'borrowings' | 'reviews'>('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, user]);

  const loadData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [statsData, borrowingsData] = await Promise.all([
        userAPI.getStats(user.id),
        userAPI.getBorrowings(user.id)
      ]);
      setStats(statsData);
      setBorrowings(borrowingsData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnBook = async (borrowingId: string) => {
    try {
      await borrowingAPI.return(borrowingId);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to return book');
    }
  };

  const handleExtendBorrowing = async (borrowingId: string) => {
    try {
      await borrowingAPI.extend(borrowingId);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to extend borrowing');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportAPI.exportBooks('csv');
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-books.csv';
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
              alt={user.name}
              className="w-32 h-32 rounded-full shadow-lg"
            />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
              <p className="text-gray-600 mb-4">{user.email}</p>
              <p className="text-sm text-gray-500 mb-4">
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>

              {/* Stats */}
              {stats && (
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.reviewsCount}</p>
                    <p className="text-sm text-gray-500">Reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.listsCount}</p>
                    <p className="text-sm text-gray-500">Lists</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.borrowedCount}</p>
                    <p className="text-sm text-gray-500">Borrowed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{stats.currentlyBorrowed}</p>
                    <p className="text-sm text-gray-500">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-600">{stats.followersCount}</p>
                    <p className="text-sm text-gray-500">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">{stats.followingCount}</p>
                    <p className="text-sm text-gray-500">Following</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Button variant="secondary" onClick={handleExportData}>
                Export Data
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('borrowings')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'borrowings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Borrowed Books ({stats?.currentlyBorrowed || 0})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="primary" className="w-full" onClick={() => navigate('/books')}>
                  Browse Books
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/recommendations')}>
                  Get Recommendations
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/reading-lists')}>
                  My Reading Lists
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
              {borrowings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {borrowings.slice(0, 3).map((borrowing) => (
                    <div key={borrowing.id} className="flex items-center gap-4">
                      <img
                        src={borrowing.book?.coverImage || 'https://via.placeholder.com/50x70'}
                        alt={borrowing.book?.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{borrowing.book?.title}</p>
                        <p className="text-sm text-gray-500">
                          {borrowing.status === 'borrowed' ? 'Due: ' : 'Returned: '}
                          {new Date(borrowing.status === 'borrowed' ? borrowing.dueDate : borrowing.borrowedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        borrowing.status === 'borrowed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {borrowing.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'borrowings' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Borrowed Books</h3>
            {borrowings.filter(b => b.status === 'borrowed').length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">You haven't borrowed any books yet</p>
                <Button variant="primary" onClick={() => navigate('/books')}>
                  Browse Books
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {borrowings.filter(b => b.status === 'borrowed').map((borrowing) => (
                  <div key={borrowing.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <img
                      src={borrowing.book?.coverImage || 'https://via.placeholder.com/60x80'}
                      alt={borrowing.book?.title}
                      className="w-16 h-20 object-cover rounded-lg shadow"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{borrowing.book?.title}</h4>
                      <p className="text-sm text-gray-600">{borrowing.book?.author}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Borrowed: {new Date(borrowing.borrowedAt).toLocaleDateString()}
                      </p>
                      <p className={`text-sm font-medium mt-1 ${
                        new Date(borrowing.dueDate) < new Date() ? 'text-red-600' : 'text-green-600'
                      }`}>
                        Due: {new Date(borrowing.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="primary" size="sm" onClick={() => handleReturnBook(borrowing.id)}>
                        Return
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExtendBorrowing(borrowing.id)}>
                        Extend
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
