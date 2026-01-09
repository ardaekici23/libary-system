# Frontend Setup & Run Instructions

## Prerequisites
- **Node.js** (v18 or higher recommended).
- **npm** (comes with Node.js).

## 1. Navigate to Frontend Directory
Open your terminal or command prompt and go to the frontend folder:
```bash
cd library-system/frontend
```
*(Adjust the path if you are in a different location)*

## 2. Install Dependencies
Install all the necessary React, Vite, and Tailwind packages:

### 🍎 Mac / 🐧 Linux / 🪟 Windows
```bash
npm install
```

## 3. Run Development Server
Start the application locally:
```bash
npm run dev
```

- The application will start at: **http://localhost:5173**
- Open this URL in your browser to view the app.

---

## 🏗️ Other Commands

### Build for Production
To create an optimized build for deployment:
```bash
npm run build
```

### Run Tests
```bash
npm run test
```

---

## 🛑 Troubleshooting

**Issue: "npm command not found"**
- Ensure Node.js is installed. Download it from [nodejs.org](https://nodejs.org/).

**Issue: "Connection refused"**
- Ensure the **Backend** is running first! The frontend needs the backend (running on port 5001) to fetch data.
