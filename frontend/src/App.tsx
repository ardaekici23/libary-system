import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { Home } from './pages/Home';
import { Books } from './pages/Books';
import { Admin } from './pages/Admin';
import { Recommendations } from './pages/Recommendations';
import { ReadingLists } from './pages/ReadingLists';
import { BookDetail } from './pages/BookDetail';
import { ReadingListDetail } from './pages/ReadingListDetail';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { NotFound } from './pages/NotFound';
import { Profile } from './pages/Profile';
import './App.css';

function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/books', label: 'Books' },
    { to: '/recommendations', label: 'Recommendations' },
    { to: '/reading-lists', label: 'Reading Lists' },
    { to: '/admin', label: 'Admin' },
  ];

  return (
    <header className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-sm sticky top-0 z-50 transition-colors duration-300 border-b`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} transition-colors`}>LibrarySystem</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'} transition-colors font-medium`}
              >
                {link.label}
              </Link>
            ))}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-all duration-300`}
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2 hover:opacity-80">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>{user.name}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className={`text-sm font-medium ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg ${darkMode ? 'text-white' : 'text-gray-600'}`}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden mt-4 pb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-t pt-4`}>
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'} font-medium py-2`}
                >
                  {link.label}
                </Link>
              ))}

              <div className={`flex items-center justify-between pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={toggleDarkMode}
                  className={`flex items-center space-x-2 ${darkMode ? 'text-yellow-400' : 'text-gray-600'}`}
                >
                  {darkMode ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                  <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>

              {isAuthenticated && user ? (
                <div className={`pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <Link to="/profile" className="flex items-center space-x-2 py-2" onClick={() => setMobileMenuOpen(false)}>
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className={darkMode ? 'text-white' : 'text-gray-700'}>{user.name}</span>
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="text-red-500 py-2"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className={`flex flex-col space-y-2 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={darkMode ? 'text-gray-300' : 'text-gray-600'}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function AppContent() {
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Navigation />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/reading-lists" element={<ReadingLists />} />
          <Route path="/reading-lists/:id" element={<ReadingListDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className={`${darkMode ? 'bg-gray-800' : 'bg-gray-800'} text-white`}>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">LibrarySystem</h3>
              <p className="text-gray-400 text-sm">
                AI-powered book recommendations and library management system.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/books" className="hover:text-white">Browse Books</Link></li>
                <li><Link to="/recommendations" className="hover:text-white">Get Recommendations</Link></li>
                <li><Link to="/reading-lists" className="hover:text-white">Reading Lists</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>AI Recommendations</li>
                <li>Book Reviews</li>
                <li>Reading Lists</li>
                <li>Book Borrowing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tech Stack</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>React + TypeScript</li>
                <li>Python Flask</li>
                <li>SQLite Database</li>
                <li>TailwindCSS</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            <p>Library Management System &copy; {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
