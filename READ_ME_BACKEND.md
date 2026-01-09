# Backend Setup & Run Instructions

## Prerequisites
- **Python 3.8+** must be installed.
- **pip** (Python package manager).

## 1. Navigate to Backend Directory
Open your terminal or command prompt and go to the project folder:
```bash
cd library-system/backend
```
*(Adjust the path if you are in a different location)*

## 2. Create & Activate Virtual Environment

It is recommended to use a virtual environment to manage dependencies.

### 🍎 Mac / 🐧 Linux
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate
```

### 🪟 Windows
```powershell
# Create virtual environment
python -m venv venv

# Activate it (Command Prompt)
.\venv\Scripts\activate

# OR Activate it (PowerShell)
.\venv\Scripts\Activate.ps1
```

*You know it's activated when you see `(venv)` at the start of your command line.*

## 3. Install Dependencies
Run this command to install Flask, SQLAlchemy, and other required libraries:
```bash
pip install -r requirements.txt
```

## 4. Run the Server
Start the backend API:
```bash
python app.py
```

- The server will start at: **http://localhost:5001**
- API Documentation/Endpoints will be listed in the terminal output.

---

## 🛑 Troubleshooting

**Issue: "python not found"**
- Try using `python3` instead of `python` (Mac/Linux).
- Ensure Python is added to your system PATH (Windows).

**Issue: "Module not found"**
- Ensure your virtual environment is activated (`(venv)` is visible).
- Re-run `pip install -r requirements.txt`.
