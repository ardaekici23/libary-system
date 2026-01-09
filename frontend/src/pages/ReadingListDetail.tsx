import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { readingListAPI } from '@/services/api';
import { ReadingList, Book } from '@/types';
import { handleApiError, showSuccess } from '@/utils/errorHandling';

export function ReadingListDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [list, setList] = useState<ReadingList | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeletingBook, setIsDeletingBook] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadList();
        }
    }, [id]);

    const loadList = async () => {
        setIsLoading(true);
        try {
            const data = await readingListAPI.getById(id!);
            setList(data);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveBook = async (e: React.MouseEvent, bookId: string) => {
        e.stopPropagation(); // Prevent bubbling if needed
        if (!window.confirm('Are you sure you want to remove this book from the list?')) return;

        setIsDeletingBook(bookId);
        try {
            await readingListAPI.removeBook(id!, bookId);
            showSuccess('Book removed from list');
            // Update local state to remove book
            if (list) {
                setList({
                    ...list,
                    books: list.books?.filter(b => b.id !== bookId),
                    bookCount: (list.bookCount || 0) - 1
                });
            }
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsDeletingBook(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!list) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Reading List not found</h2>
                    <Button onClick={() => navigate('/reading-lists')}>Back to Lists</Button>
                </div>
            </div>
        );
    }

    const books = list.books || [];

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="container mx-auto max-w-6xl">
                <button
                    onClick={() => navigate('/reading-lists')}
                    className="flex items-center text-slate-600 hover:text-violet-600 mb-8 transition-colors group glass-effect px-4 py-2 rounded-xl border border-white/20 w-fit"
                >
                    <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-semibold">Back to Lists</span>
                </button>

                <div className="mb-12 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">{list.name}</h1>
                    <p className="text-xl text-slate-600 max-w-2xl">{list.description}</p>
                    <div className="mt-6 flex flex-wrap gap-4">
                        <Button variant="primary" onClick={() => navigate('/books')}>
                            Browse Books to Add
                        </Button>
                    </div>
                </div>

                {books.length === 0 ? (
                    <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-sm">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">This list is empty</h3>
                        <p className="text-slate-600 mb-6">Start building your collection by adding some books.</p>
                        <Button variant="primary" onClick={() => navigate('/books')}>
                            Discover Books
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {books.map((book) => (
                            <div key={book.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div
                                    className="h-64 overflow-hidden relative cursor-pointer"
                                    onClick={() => navigate(`/books/${book.id}`)}
                                >
                                    <img
                                        src={book.coverImage}
                                        alt={book.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                        <span className="text-white font-medium">View Details</span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-slate-900 mb-1 line-clamp-1">{book.title}</h3>
                                        <p className="text-slate-600 font-medium">{book.author}</p>
                                    </div>

                                    <div className="flex justify-between items-center mt-6">
                                        <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{book.category}</span>
                                        <button
                                            onClick={(e) => handleRemoveBook(e, book.id)}
                                            disabled={isDeletingBook === book.id}
                                            className="text-red-500 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                                        >
                                            {isDeletingBook === book.id ? 'Removing...' : 'Remove'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
