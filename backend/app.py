from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime, timedelta
import os
import json
import csv
import io

app = Flask(__name__)
CORS(app)

# Get absolute path for database
base_dir = os.path.dirname(os.path.abspath(__file__))
database_path = os.path.join(base_dir, '..', 'database', 'library.db')

# Ensure database directory exists
os.makedirs(os.path.dirname(database_path), exist_ok=True)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{database_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'

db = SQLAlchemy(app)

# ============================================================================
# MODELS
# ============================================================================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    name = db.Column(db.String(100))
    avatar = db.Column(db.String(500))
    bio = db.Column(db.Text)
    role = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    reviews = db.relationship('Review', backref='user', lazy=True, cascade='all, delete-orphan')
    reading_lists = db.relationship('ReadingList', backref='user', lazy=True, cascade='all, delete-orphan')
    borrowings = db.relationship('Borrowing', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_email=False):
        data = {
            'id': str(self.id),
            'username': self.username,
            'name': self.name or self.username,
            'avatar': self.avatar or f'https://api.dicebear.com/7.x/avataaars/svg?seed={self.username}',
            'bio': self.bio or '',
            'role': self.role,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'reviewCount': len(self.reviews),
            'listCount': len(self.reading_lists)
        }
        if include_email:
            data['email'] = self.email
        return data


class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    isbn = db.Column(db.String(20))
    category = db.Column(db.String(50))
    description = db.Column(db.Text)
    cover_image = db.Column(db.String(500))
    rating = db.Column(db.Float, default=4.0)
    published_year = db.Column(db.Integer, default=2020)
    page_count = db.Column(db.Integer, default=300)
    language = db.Column(db.String(20), default='English')
    publisher = db.Column(db.String(100))
    available_copies = db.Column(db.Integer, default=5)
    total_copies = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    reviews = db.relationship('Review', backref='book', lazy=True, cascade='all, delete-orphan')
    borrowings = db.relationship('Borrowing', backref='book', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        avg_rating = db.session.query(db.func.avg(Review.rating)).filter(Review.book_id == self.id).scalar()
        review_count = Review.query.filter_by(book_id=self.id).count()

        return {
            'id': str(self.id),
            'title': self.title,
            'author': self.author,
            'isbn': self.isbn or '',
            'category': self.category or '',
            'genre': self.category or '',
            'description': self.description or '',
            'coverImage': self.cover_image or f'https://picsum.photos/seed/{self.id}/300/400',
            'rating': round(avg_rating, 1) if avg_rating else self.rating or 4.0,
            'publishedYear': self.published_year or 2020,
            'pageCount': self.page_count or 300,
            'language': self.language or 'English',
            'publisher': self.publisher or '',
            'availableCopies': self.available_copies,
            'totalCopies': self.total_copies,
            'reviewCount': review_count,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'userId': str(self.user_id),
            'bookId': str(self.book_id),
            'rating': self.rating,
            'comment': self.comment or '',
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'user': self.user.to_dict() if self.user else None
        }


class ReadingList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Many-to-many relationship with books
    books = db.relationship('Book', secondary='reading_list_books', backref='reading_lists')

    def to_dict(self):
        return {
            'id': str(self.id),
            'userId': str(self.user_id),
            'name': self.name,
            'description': self.description or '',
            'isPublic': self.is_public,
            'bookCount': len(self.books),
            'books': [book.to_dict() for book in self.books],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'user': self.user.to_dict() if self.user else None
        }


# Association table for reading lists and books
reading_list_books = db.Table('reading_list_books',
    db.Column('reading_list_id', db.Integer, db.ForeignKey('reading_list.id'), primary_key=True),
    db.Column('book_id', db.Integer, db.ForeignKey('book.id'), primary_key=True),
    db.Column('added_at', db.DateTime, default=datetime.utcnow)
)


class Borrowing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    borrowed_at = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime)
    returned_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='borrowed')  # borrowed, returned, overdue

    def to_dict(self):
        return {
            'id': str(self.id),
            'userId': str(self.user_id),
            'bookId': str(self.book_id),
            'borrowedAt': self.borrowed_at.isoformat() if self.borrowed_at else None,
            'dueDate': self.due_date.isoformat() if self.due_date else None,
            'returnedAt': self.returned_at.isoformat() if self.returned_at else None,
            'status': self.status,
            'book': self.book.to_dict() if self.book else None,
            'user': self.user.to_dict() if self.user else None
        }


class Follow(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    following_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    follower = db.relationship('User', foreign_keys=[follower_id], backref='following')
    following = db.relationship('User', foreign_keys=[following_id], backref='followers')


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

with app.app_context():
    db.create_all()

    # Add sample users if empty
    if User.query.count() == 0:
        print("Adding sample users...")
        sample_users = [
            User(username='john_reader', email='john@example.com', name='John Doe', role='user'),
            User(username='jane_bookworm', email='jane@example.com', name='Jane Smith', role='user'),
            User(username='admin', email='admin@example.com', name='Admin User', role='admin'),
        ]
        for user in sample_users:
            user.set_password('password123')
        db.session.add_all(sample_users)
        db.session.commit()
        print(f"Added {len(sample_users)} sample users.")

    # Add sample books if empty
    if Book.query.count() == 0:
        print("Adding sample books...")
        sample_books = [
            Book(title='The Silent Patient', author='Alex Michaelides', category='Mystery',
                 description='A psychological thriller about a woman who shoots her husband and then stops speaking. Alicia Berenson lived a seemingly perfect life until one day she shot her husband five times and never spoke another word.',
                 isbn='9781250301697', rating=4.5, published_year=2019, page_count=336, publisher='Celadon Books'),
            Book(title='Atomic Habits', author='James Clear', category='Self-Help',
                 description='A guide to building good habits and breaking bad ones. Learn how tiny changes can lead to remarkable results.',
                 isbn='9780735211292', rating=4.8, published_year=2018, page_count=320, publisher='Avery'),
            Book(title='Dune', author='Frank Herbert', category='Sci-Fi',
                 description='Epic science fiction set in the distant future amidst a feudal interstellar society. Follow Paul Atreides as he navigates politics, religion, and ecology on the desert planet Arrakis.',
                 isbn='9780441013593', rating=4.7, published_year=1965, page_count=688, publisher='Ace'),
            Book(title='The Midnight Library', author='Matt Haig', category='Fiction',
                 description='A novel about a library that contains books that let you experience the lives you could have lived. Nora Seed finds herself in a library between life and death.',
                 isbn='9780525559474', rating=4.3, published_year=2020, page_count=304, publisher='Viking'),
            Book(title='Project Hail Mary', author='Andy Weir', category='Sci-Fi',
                 description='A lone astronaut must save humanity from an extinction-level event. Ryland Grace wakes up on a spaceship with no memory of how he got there.',
                 isbn='9780593135204', rating=4.9, published_year=2021, page_count=496, publisher='Ballantine Books'),
            Book(title='Educated', author='Tara Westover', category='Memoir',
                 description='A memoir about a woman who leaves her survivalist family and goes on to earn a PhD from Cambridge University.',
                 isbn='9780399590504', rating=4.6, published_year=2018, page_count=352, publisher='Random House'),
            Book(title='The Song of Achilles', author='Madeline Miller', category='Historical Fiction',
                 description='A retelling of the Iliad from the perspective of Patroclus, exploring his relationship with Achilles.',
                 isbn='9780062060624', rating=4.4, published_year=2011, page_count=416, publisher='Ecco'),
            Book(title='The Thursday Murder Club', author='Richard Osman', category='Mystery',
                 description='Four retirees investigate murders in their retirement village. A witty and warm-hearted mystery.',
                 isbn='9781984880963', rating=4.2, published_year=2020, page_count=400, publisher='Pamela Dorman Books'),
            Book(title='Where the Crawdads Sing', author='Delia Owens', category='Fiction',
                 description='A coming-of-age story about Kya Clark, the so-called Marsh Girl who raised herself in the marshes of North Carolina.',
                 isbn='9780735219090', rating=4.5, published_year=2018, page_count=384, publisher='G.P. Putnam\'s Sons'),
            Book(title='The Seven Husbands of Evelyn Hugo', author='Taylor Jenkins Reid', category='Fiction',
                 description='Aging Hollywood icon Evelyn Hugo finally tells the story of her glamorous and scandalous life.',
                 isbn='9781501161933', rating=4.6, published_year=2017, page_count=400, publisher='Atria Books'),
        ]
        db.session.add_all(sample_books)
        db.session.commit()
        print(f"Added {len(sample_books)} sample books.")

    # Add sample reviews if empty
    if Review.query.count() == 0:
        print("Adding sample reviews...")
        sample_reviews = [
            Review(user_id=1, book_id=1, rating=5, comment="Absolutely gripping! Couldn't put it down."),
            Review(user_id=2, book_id=1, rating=4, comment="Great thriller with an unexpected twist."),
            Review(user_id=1, book_id=2, rating=5, comment="Life-changing book. Highly recommend!"),
            Review(user_id=2, book_id=3, rating=5, comment="A masterpiece of science fiction."),
            Review(user_id=1, book_id=5, rating=5, comment="Andy Weir does it again! Amazing story."),
        ]
        db.session.add_all(sample_reviews)
        db.session.commit()
        print(f"Added {len(sample_reviews)} sample reviews.")

    # Add sample reading lists if empty
    if ReadingList.query.count() == 0:
        print("Adding sample reading lists...")
        list1 = ReadingList(user_id=1, name='My Favorites', description='Books I absolutely loved', is_public=True)
        list2 = ReadingList(user_id=1, name='To Read', description='Books on my reading list', is_public=True)
        list3 = ReadingList(user_id=2, name='Sci-Fi Essentials', description='Must-read science fiction', is_public=True)
        db.session.add_all([list1, list2, list3])
        db.session.commit()

        # Add books to lists
        list1.books.extend(Book.query.filter(Book.id.in_([1, 2, 5])).all())
        list2.books.extend(Book.query.filter(Book.id.in_([4, 6, 7])).all())
        list3.books.extend(Book.query.filter(Book.id.in_([3, 5])).all())
        db.session.commit()
        print("Added sample reading lists with books.")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_recommendations(user_id, top_n=5):
    """Content-based recommendation system using TF-IDF"""
    try:
        books = Book.query.all()
        if len(books) < 2:
            return []

        book_data = []
        for book in books:
            features = f"{book.title} {book.author} {book.category} {book.description or ''}"
            book_data.append({'id': book.id, 'features': features, 'book': book})

        vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        tfidf_matrix = vectorizer.fit_transform([bd['features'] for bd in book_data])
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

        # Get user's reviewed/borrowed books for better recommendations
        user_book_ids = set()
        user_reviews = Review.query.filter_by(user_id=user_id).all()
        user_borrowings = Borrowing.query.filter_by(user_id=user_id).all()

        for review in user_reviews:
            user_book_ids.add(review.book_id)
        for borrowing in user_borrowings:
            user_book_ids.add(borrowing.book_id)

        if user_book_ids:
            # Recommend based on user's history
            all_scores = {}
            for book_id in user_book_ids:
                idx = next((i for i, bd in enumerate(book_data) if bd['id'] == book_id), None)
                if idx is not None:
                    for i, score in enumerate(cosine_sim[idx]):
                        if book_data[i]['id'] not in user_book_ids:
                            all_scores[i] = all_scores.get(i, 0) + score

            sorted_indices = sorted(all_scores.keys(), key=lambda x: all_scores[x], reverse=True)
            recommendations = [book_data[i]['book'].to_dict() for i in sorted_indices[:top_n]]
        else:
            # For new users, recommend popular books
            target_idx = user_id % len(books)
            sim_scores = sorted(enumerate(cosine_sim[target_idx]), key=lambda x: x[1], reverse=True)
            top_indices = [i for i, _ in sim_scores[1:top_n+1]]
            recommendations = [book_data[i]['book'].to_dict() for i in top_indices]

        return recommendations
    except Exception as e:
        print(f"Recommendation error: {e}")
        return []


def get_content_recommendations(query, top_n=5):
    """Recommend books based on text query using TF-IDF"""
    try:
        books = Book.query.all()
        if not books:
            return []

        book_data = []
        for book in books:
            features = f"{book.title} {book.author} {book.category} {book.description or ''}"
            book_data.append({'id': book.id, 'features': features, 'book': book})

        # Add the query to the corpus to calculate similarity
        corpus = [bd['features'] for bd in book_data]
        corpus.append(query)

        vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        # Calculate cosine similarity between the query (last item) and all books
        query_vec = tfidf_matrix[-1]
        book_vecs = tfidf_matrix[:-1]
        
        cosine_sim = cosine_similarity(query_vec, book_vecs).flatten()
        
        # Get top indices
        sim_scores = sorted(enumerate(cosine_sim), key=lambda x: x[1], reverse=True)
        top_indices = [i for i, _ in sim_scores[:top_n]]
        
        recommendations = [book_data[i]['book'].to_dict() for i in top_indices]
        return recommendations
    except Exception as e:
        print(f"Content recommendation error: {e}")
        return []


# ============================================================================
# AUTH API ROUTES
# ============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400

    user = User(
        username=data['username'],
        email=data['email'],
        name=data.get('name', data['username'])
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Registration successful', 'user': user.to_dict(include_email=True)}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    return jsonify({'message': 'Login successful', 'user': user.to_dict(include_email=True)})


# ============================================================================
# RECOMMENDATIONS API
# ============================================================================

@app.route('/api/recommendations/<int:user_id>', methods=['GET'])
def recommendations(user_id):
    top_n = request.args.get('limit', 5, type=int)
    recs = get_recommendations(user_id, top_n)
    return jsonify({
        'user_id': user_id,
        'limit': top_n,
        'recommendations': recs
    })


@app.route('/api/recommendations', methods=['GET'])
def recommendations_default():
    query = request.args.get('query')
    top_n = request.args.get('limit', 5, type=int)
    
    if query:
        recs = get_content_recommendations(query, top_n)
    else:
        recs = get_recommendations(1, top_n)
        
    return jsonify({
        'user_id': 1,
        'query': query,
        'recommendations': recs
    })


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict(include_email=True))


@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json

    user.name = data.get('name', user.name)
    user.bio = data.get('bio', user.bio)
    user.avatar = data.get('avatar', user.avatar)

    db.session.commit()
    return jsonify(user.to_dict(include_email=True))


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'})


@app.route('/api/users/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    user = User.query.get_or_404(user_id)

    reviews_count = Review.query.filter_by(user_id=user_id).count()
    lists_count = ReadingList.query.filter_by(user_id=user_id).count()
    borrowed_count = Borrowing.query.filter_by(user_id=user_id).count()
    currently_borrowed = Borrowing.query.filter_by(user_id=user_id, status='borrowed').count()

    followers_count = Follow.query.filter_by(following_id=user_id).count()
    following_count = Follow.query.filter_by(follower_id=user_id).count()

    return jsonify({
        'reviewsCount': reviews_count,
        'listsCount': lists_count,
        'borrowedCount': borrowed_count,
        'currentlyBorrowed': currently_borrowed,
        'followersCount': followers_count,
        'followingCount': following_count
    })


# ============================================================================
# BOOK API ROUTES
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Library API',
        'database': 'connected',
        'books_count': Book.query.count(),
        'users_count': User.query.count()
    })


@app.route('/api/books', methods=['GET'])
def get_books():
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Filters
    category = request.args.get('category')
    min_rating = request.args.get('min_rating', type=float)
    max_rating = request.args.get('max_rating', type=float)
    min_year = request.args.get('min_year', type=int)
    max_year = request.args.get('max_year', type=int)
    author = request.args.get('author')
    sort_by = request.args.get('sort_by', 'title')
    sort_order = request.args.get('sort_order', 'asc')

    query = Book.query

    if category:
        query = query.filter(Book.category.ilike(f'%{category}%'))
    if min_rating:
        query = query.filter(Book.rating >= min_rating)
    if max_rating:
        query = query.filter(Book.rating <= max_rating)
    if min_year:
        query = query.filter(Book.published_year >= min_year)
    if max_year:
        query = query.filter(Book.published_year <= max_year)
    if author:
        query = query.filter(Book.author.ilike(f'%{author}%'))

    # Sorting
    sort_column = getattr(Book, sort_by, Book.title)
    if sort_order == 'desc':
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'books': [book.to_dict() for book in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'currentPage': page,
        'perPage': per_page
    })


@app.route('/api/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    book = Book.query.get_or_404(book_id)
    return jsonify(book.to_dict())


@app.route('/api/books', methods=['POST'])
def create_book():
    data = request.json
    book = Book(
        title=data['title'],
        author=data['author'],
        isbn=data.get('isbn', ''),
        category=data.get('category', data.get('genre', '')),
        description=data.get('description', ''),
        cover_image=data.get('coverImage', ''),
        rating=data.get('rating', 4.0),
        published_year=data.get('publishedYear', 2020),
        page_count=data.get('pageCount', 300),
        publisher=data.get('publisher', ''),
        language=data.get('language', 'English'),
        available_copies=data.get('availableCopies', 5),
        total_copies=data.get('totalCopies', 5)
    )
    db.session.add(book)
    db.session.commit()
    return jsonify(book.to_dict()), 201


@app.route('/api/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    book = Book.query.get_or_404(book_id)
    data = request.json

    book.title = data.get('title', book.title)
    book.author = data.get('author', book.author)
    book.isbn = data.get('isbn', book.isbn)
    book.category = data.get('category', data.get('genre', book.category))
    book.description = data.get('description', book.description)
    book.cover_image = data.get('coverImage', book.cover_image)
    book.rating = data.get('rating', book.rating)
    book.published_year = data.get('publishedYear', book.published_year)
    book.page_count = data.get('pageCount', book.page_count)
    book.publisher = data.get('publisher', book.publisher)

    db.session.commit()
    return jsonify(book.to_dict())


@app.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    book = Book.query.get_or_404(book_id)
    db.session.delete(book)
    db.session.commit()
    return jsonify({'message': 'Book deleted successfully'})


@app.route('/api/books/isbn/<isbn>', methods=['GET'])
def get_book_by_isbn(isbn):
    """Get book by ISBN - useful for barcode scanning"""
    book = Book.query.filter_by(isbn=isbn).first()
    if book:
        return jsonify(book.to_dict())
    return jsonify({'error': 'Book not found', 'isbn': isbn}), 404


@app.route('/api/books/import', methods=['POST'])
def import_book():
    """Import book from Google Books API data"""
    data = request.json

    # Check if book already exists
    if data.get('isbn'):
        existing = Book.query.filter_by(isbn=data['isbn']).first()
        if existing:
            return jsonify({'error': 'Book with this ISBN already exists', 'book': existing.to_dict()}), 400

    book = Book(
        title=data.get('title', 'Unknown Title'),
        author=data.get('author', 'Unknown Author'),
        isbn=data.get('isbn', ''),
        category=data.get('category', ''),
        description=data.get('description', ''),
        cover_image=data.get('coverImage', ''),
        published_year=data.get('publishedYear', 2020),
        page_count=data.get('pageCount', 300),
        publisher=data.get('publisher', ''),
        language=data.get('language', 'English')
    )
    db.session.add(book)
    db.session.commit()
    return jsonify(book.to_dict()), 201


# ============================================================================
# SEARCH API
# ============================================================================

@app.route('/api/search', methods=['GET'])
def search_books():
    query = request.args.get('q', '')
    category = request.args.get('category')
    min_rating = request.args.get('min_rating', type=float)
    min_year = request.args.get('min_year', type=int)
    max_year = request.args.get('max_year', type=int)
    limit = request.args.get('limit', 20, type=int)

    search_query = Book.query

    if query:
        search_query = search_query.filter(
            Book.title.ilike(f'%{query}%') |
            Book.author.ilike(f'%{query}%') |
            Book.category.ilike(f'%{query}%') |
            Book.description.ilike(f'%{query}%') |
            Book.isbn.ilike(f'%{query}%')
        )

    if category:
        search_query = search_query.filter(Book.category.ilike(f'%{category}%'))
    if min_rating:
        search_query = search_query.filter(Book.rating >= min_rating)
    if min_year:
        search_query = search_query.filter(Book.published_year >= min_year)
    if max_year:
        search_query = search_query.filter(Book.published_year <= max_year)

    books = search_query.limit(limit).all()
    return jsonify([book.to_dict() for book in books])


@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = db.session.query(Book.category, db.func.count(Book.id)).group_by(Book.category).all()
    return jsonify([{'name': cat[0], 'count': cat[1]} for cat in categories if cat[0]])


# ============================================================================
# REVIEW API ROUTES
# ============================================================================

@app.route('/api/reviews', methods=['GET'])
def get_all_reviews():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    pagination = Review.query.order_by(Review.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'reviews': [review.to_dict() for review in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'currentPage': page
    })


@app.route('/api/books/<int:book_id>/reviews', methods=['GET'])
def get_book_reviews(book_id):
    reviews = Review.query.filter_by(book_id=book_id).order_by(Review.created_at.desc()).all()
    return jsonify([review.to_dict() for review in reviews])


@app.route('/api/books/<int:book_id>/reviews', methods=['POST'])
def create_review(book_id):
    data = request.json

    # Check if user already reviewed this book
    existing = Review.query.filter_by(user_id=data['userId'], book_id=book_id).first()
    if existing:
        return jsonify({'error': 'You have already reviewed this book'}), 400

    review = Review(
        user_id=data['userId'],
        book_id=book_id,
        rating=data['rating'],
        comment=data.get('comment', '')
    )
    db.session.add(review)
    db.session.commit()

    return jsonify(review.to_dict()), 201


@app.route('/api/reviews/<int:review_id>', methods=['PUT'])
def update_review(review_id):
    review = Review.query.get_or_404(review_id)
    data = request.json

    review.rating = data.get('rating', review.rating)
    review.comment = data.get('comment', review.comment)

    db.session.commit()
    return jsonify(review.to_dict())


@app.route('/api/reviews/<int:review_id>', methods=['DELETE'])
def delete_review(review_id):
    review = Review.query.get_or_404(review_id)
    db.session.delete(review)
    db.session.commit()
    return jsonify({'message': 'Review deleted successfully'})


@app.route('/api/users/<int:user_id>/reviews', methods=['GET'])
def get_user_reviews(user_id):
    reviews = Review.query.filter_by(user_id=user_id).order_by(Review.created_at.desc()).all()
    return jsonify([review.to_dict() for review in reviews])


# ============================================================================
# READING LIST API ROUTES
# ============================================================================

@app.route('/api/reading-lists', methods=['GET'])
def get_all_reading_lists():
    # Get public lists
    is_public = request.args.get('public', 'true').lower() == 'true'

    if is_public:
        lists = ReadingList.query.filter_by(is_public=True).order_by(ReadingList.updated_at.desc()).all()
    else:
        lists = ReadingList.query.order_by(ReadingList.updated_at.desc()).all()

    return jsonify([lst.to_dict() for lst in lists])


@app.route('/api/reading-lists/<int:list_id>', methods=['GET'])
def get_reading_list(list_id):
    reading_list = ReadingList.query.get_or_404(list_id)
    return jsonify(reading_list.to_dict())


@app.route('/api/reading-lists', methods=['POST'])
def create_reading_list():
    data = request.json

    reading_list = ReadingList(
        user_id=data['userId'],
        name=data['name'],
        description=data.get('description', ''),
        is_public=data.get('isPublic', True)
    )
    db.session.add(reading_list)
    db.session.commit()

    # Add books if provided
    if data.get('bookIds'):
        books = Book.query.filter(Book.id.in_(data['bookIds'])).all()
        reading_list.books.extend(books)
        db.session.commit()

    return jsonify(reading_list.to_dict()), 201


@app.route('/api/reading-lists/<int:list_id>', methods=['PUT'])
def update_reading_list(list_id):
    reading_list = ReadingList.query.get_or_404(list_id)
    data = request.json

    reading_list.name = data.get('name', reading_list.name)
    reading_list.description = data.get('description', reading_list.description)
    reading_list.is_public = data.get('isPublic', reading_list.is_public)

    db.session.commit()
    return jsonify(reading_list.to_dict())


@app.route('/api/reading-lists/<int:list_id>', methods=['DELETE'])
def delete_reading_list(list_id):
    reading_list = ReadingList.query.get_or_404(list_id)
    db.session.delete(reading_list)
    db.session.commit()
    return jsonify({'message': 'Reading list deleted successfully'})


@app.route('/api/reading-lists/<int:list_id>/books/<int:book_id>', methods=['POST'])
def add_book_to_list(list_id, book_id):
    reading_list = ReadingList.query.get_or_404(list_id)
    book = Book.query.get_or_404(book_id)

    if book in reading_list.books:
        return jsonify({'error': 'Book already in list'}), 400

    reading_list.books.append(book)
    db.session.commit()
    return jsonify(reading_list.to_dict())


@app.route('/api/reading-lists/<int:list_id>/books/<int:book_id>', methods=['DELETE'])
def remove_book_from_list(list_id, book_id):
    reading_list = ReadingList.query.get_or_404(list_id)
    book = Book.query.get_or_404(book_id)

    if book in reading_list.books:
        reading_list.books.remove(book)
        db.session.commit()

    return jsonify(reading_list.to_dict())


@app.route('/api/users/<int:user_id>/reading-lists', methods=['GET'])
def get_user_reading_lists(user_id):
    lists = ReadingList.query.filter_by(user_id=user_id).order_by(ReadingList.updated_at.desc()).all()
    return jsonify([lst.to_dict() for lst in lists])


# ============================================================================
# BORROWING API ROUTES
# ============================================================================

@app.route('/api/borrowings', methods=['GET'])
def get_all_borrowings():
    status = request.args.get('status')

    query = Borrowing.query
    if status:
        query = query.filter_by(status=status)

    borrowings = query.order_by(Borrowing.borrowed_at.desc()).all()
    return jsonify([b.to_dict() for b in borrowings])


@app.route('/api/books/<int:book_id>/borrow', methods=['POST'])
def borrow_book(book_id):
    data = request.json
    book = Book.query.get_or_404(book_id)

    if book.available_copies <= 0:
        return jsonify({'error': 'No copies available'}), 400

    # Check if user already has this book borrowed
    existing = Borrowing.query.filter_by(user_id=data['userId'], book_id=book_id, status='borrowed').first()
    if existing:
        return jsonify({'error': 'You already have this book borrowed'}), 400

    borrowing = Borrowing(
        user_id=data['userId'],
        book_id=book_id,
        due_date=datetime.utcnow() + timedelta(days=14)
    )

    book.available_copies -= 1

    db.session.add(borrowing)
    db.session.commit()

    return jsonify(borrowing.to_dict()), 201


@app.route('/api/borrowings/<int:borrowing_id>/return', methods=['POST'])
def return_book(borrowing_id):
    borrowing = Borrowing.query.get_or_404(borrowing_id)

    if borrowing.status == 'returned':
        return jsonify({'error': 'Book already returned'}), 400

    borrowing.status = 'returned'
    borrowing.returned_at = datetime.utcnow()
    borrowing.book.available_copies += 1

    db.session.commit()
    return jsonify(borrowing.to_dict())


@app.route('/api/borrowings/<int:borrowing_id>/extend', methods=['POST'])
def extend_borrowing(borrowing_id):
    borrowing = Borrowing.query.get_or_404(borrowing_id)

    if borrowing.status != 'borrowed':
        return jsonify({'error': 'Cannot extend - book not currently borrowed'}), 400

    borrowing.due_date = borrowing.due_date + timedelta(days=7)
    db.session.commit()

    return jsonify(borrowing.to_dict())


@app.route('/api/users/<int:user_id>/borrowings', methods=['GET'])
def get_user_borrowings(user_id):
    status = request.args.get('status')

    query = Borrowing.query.filter_by(user_id=user_id)
    if status:
        query = query.filter_by(status=status)

    borrowings = query.order_by(Borrowing.borrowed_at.desc()).all()
    return jsonify([b.to_dict() for b in borrowings])


# ============================================================================
# SOCIAL API ROUTES (Follow/Unfollow)
# ============================================================================

@app.route('/api/users/<int:user_id>/follow', methods=['POST'])
def follow_user(user_id):
    data = request.json
    follower_id = data['followerId']

    if follower_id == user_id:
        return jsonify({'error': 'Cannot follow yourself'}), 400

    existing = Follow.query.filter_by(follower_id=follower_id, following_id=user_id).first()
    if existing:
        return jsonify({'error': 'Already following this user'}), 400

    follow = Follow(follower_id=follower_id, following_id=user_id)
    db.session.add(follow)
    db.session.commit()

    return jsonify({'message': 'Successfully followed user'})


@app.route('/api/users/<int:user_id>/unfollow', methods=['POST'])
def unfollow_user(user_id):
    data = request.json
    follower_id = data['followerId']

    follow = Follow.query.filter_by(follower_id=follower_id, following_id=user_id).first()
    if follow:
        db.session.delete(follow)
        db.session.commit()

    return jsonify({'message': 'Successfully unfollowed user'})


@app.route('/api/users/<int:user_id>/followers', methods=['GET'])
def get_followers(user_id):
    follows = Follow.query.filter_by(following_id=user_id).all()
    return jsonify([f.follower.to_dict() for f in follows])


@app.route('/api/users/<int:user_id>/following', methods=['GET'])
def get_following(user_id):
    follows = Follow.query.filter_by(follower_id=user_id).all()
    return jsonify([f.following.to_dict() for f in follows])


# ============================================================================
# EXPORT API ROUTES
# ============================================================================

@app.route('/api/export/books', methods=['GET'])
def export_books():
    format_type = request.args.get('format', 'json')
    books = Book.query.all()

    if format_type == 'csv':
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Title', 'Author', 'Category', 'ISBN', 'Rating', 'Published Year', 'Description'])

        for book in books:
            writer.writerow([book.id, book.title, book.author, book.category, book.isbn, book.rating, book.published_year, book.description])

        return output.getvalue(), 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=books.csv'
        }

    return jsonify([book.to_dict() for book in books])


@app.route('/api/export/reading-list/<int:list_id>', methods=['GET'])
def export_reading_list(list_id):
    format_type = request.args.get('format', 'json')
    reading_list = ReadingList.query.get_or_404(list_id)

    if format_type == 'csv':
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Title', 'Author', 'Category', 'Rating'])

        for book in reading_list.books:
            writer.writerow([book.title, book.author, book.category, book.rating])

        return output.getvalue(), 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': f'attachment; filename={reading_list.name}.csv'
        }

    return jsonify(reading_list.to_dict())




# ============================================================================
# STATS API
# ============================================================================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    total_books = Book.query.count()
    total_users = User.query.count()
    total_reviews = Review.query.count()
    total_borrowings = Borrowing.query.count()
    active_borrowings = Borrowing.query.filter_by(status='borrowed').count()

    category_counts = {}
    for book in Book.query.all():
        if book.category:
            category_counts[book.category] = category_counts.get(book.category, 0) + 1

    # Top rated books
    top_books = Book.query.order_by(Book.rating.desc()).limit(5).all()

    # Most reviewed books
    most_reviewed = db.session.query(Book, db.func.count(Review.id).label('review_count'))\
        .join(Review).group_by(Book.id).order_by(db.text('review_count DESC')).limit(5).all()

    return jsonify({
        'totalBooks': total_books,
        'totalUsers': total_users,
        'totalReviews': total_reviews,
        'totalBorrowings': total_borrowings,
        'activeBorrowings': active_borrowings,
        'categoryBreakdown': category_counts,
        'topRatedBooks': [book.to_dict() for book in top_books],
        'mostReviewedBooks': [{'book': book.to_dict(), 'reviewCount': count} for book, count in most_reviewed]
    })


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("Library Management System API v2.0")
    print("=" * 60)
    print(f"Database: {database_path}")
    print(f"API URL: http://localhost:5001")
    print("=" * 60)
    print("API Endpoints:")
    print("  Auth: /api/auth/register, /api/auth/login")
    print("  Users: /api/users, /api/users/<id>")
    print("  Books: /api/books, /api/books/<id>")
    print("  Reviews: /api/books/<id>/reviews")
    print("  Reading Lists: /api/reading-lists")
    print("  Borrowing: /api/books/<id>/borrow")
    print("  Social: /api/users/<id>/follow")
    print("  Export: /api/export/books?format=csv")
    print("  Stats: /api/stats")
    print("=" * 60)

    app.run(debug=True, host='0.0.0.0', port=5001)
