# PassOP

A full-stack password manager built with React, Vite, Express, and MongoDB. PassOP encrypts credentials in the browser before storage, then syncs the encrypted vault to MongoDB through a backend API.

## Why This Project

PassOP was built to demonstrate a practical full-stack application with:

- secure client-side encryption using the Web Crypto API
- a responsive React user interface
- backend persistence with Express and MongoDB
- local encrypted fallback when the backend is unavailable
- a clean CRUD flow for password management

This makes it a strong portfolio project for showcasing frontend, backend, browser APIs, and application design decisions in one system.

## Live Demo

- Frontend: `Add your deployed frontend URL here`
- Backend API: `Add your deployed backend URL here`

## Screenshots

Add screenshots here after deployment.

```text
- Home / Vault Access
- Password Table
- Add / Edit Password Flow
```

## Features

- Create a vault with a master password
- Unlock an existing encrypted vault
- Encrypt password entries in the browser before persistence
- Store encrypted vault data in MongoDB
- Add, edit, delete, and copy saved credentials
- Mask saved passwords in the UI
- Validate website URLs before opening them
- Use local encrypted storage as a fallback if the backend is offline
- Migrate older locally stored data into the encrypted vault flow
- Responsive interface for desktop and mobile

## Tech Stack

### Frontend

- React 18
- Vite 5
- Tailwind CSS
- React Toastify
- Web Crypto API

### Backend

- Node.js
- Express
- MongoDB
- dotenv
- cors

## Architecture

```text
User Input
   |
   v
React Frontend
   |
   |-- Encrypt data in browser with master password
   |
   +-- Save encrypted vault to localStorage
   |
   +-- Sync encrypted vault to Express API
                          |
                          v
                       MongoDB
```

## Folder Structure

```text
.
|-- backend/
|   |-- .env
|   |-- package.json
|   `-- server.js
|-- public/
|   `-- icons/
|-- src/
|   |-- components/
|   |   |-- Footer.jsx
|   |   |-- Manager.jsx
|   |   `-- Navbar.jsx
|   |-- App.jsx
|   |-- index.css
|   `-- main.jsx
|-- .env
|-- package.json
`-- README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <your-project-folder>
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

## Environment Variables

### Frontend `.env`

Create a root `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Backend `backend/.env`

Create a `backend/.env` file:

```env
MONGO_URI=your_mongodb_connection_string
DB_NAME=passop
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
VAULT_KEY=default
```

## Run the Project

### Start backend

```bash
npm run server
```

### Start frontend

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

Backend runs on:

```text
http://localhost:3000
```

## Available Scripts

### Root scripts

- `npm run dev` - start frontend development server
- `npm run build` - create frontend production build
- `npm run preview` - preview the frontend build
- `npm run lint` - run ESLint
- `npm run server` - run backend in watch mode
- `npm run server:start` - run backend normally

### Backend scripts

- `npm run dev` - run backend with watch mode
- `npm run start` - run backend once
- `npm run check` - syntax check backend server

## API Endpoints

### `GET /api/health`

Checks whether the backend and database connection are healthy.

### `GET /api/vault`

Fetches the encrypted vault document from MongoDB.

### `PUT /api/vault`

Creates or updates the encrypted vault document.

## Security Notes

- Credentials are encrypted in the browser before they are sent to the backend.
- MongoDB stores only encrypted vault payloads, not plain-text passwords.
- The backend does not store the master password.
- If the master password is forgotten, vault contents cannot be recovered.
- Since decryption happens client-side, device and browser security still matter.

## Deployment Guide

### Frontend

Deploy the frontend to:

- Vercel
- Netlify

Important:

- set `VITE_API_BASE_URL` to your deployed backend URL

Example:

```env
VITE_API_BASE_URL=https://your-backend-service.onrender.com
```

### Backend

Deploy the backend to:

- Render
- Railway
- Cyclic

Required backend env vars in deployment:

```env
MONGO_URI=your_mongodb_connection_string
DB_NAME=passop
PORT=3000
CLIENT_ORIGIN=https://your-frontend-domain.vercel.app
VAULT_KEY=default
```

## Resume-Friendly Project Summary

PassOP is a full-stack encrypted password manager that demonstrates:

- React-based frontend architecture
- API integration with Express and MongoDB
- client-side encryption with the Web Crypto API
- secure vault persistence using encrypted payloads
- fallback handling for offline or unavailable backend states

## Future Improvements

- user authentication and per-user vaults
- stronger backend validation and rate limiting
- password generator
- search and filter support
- better vault recovery and account management options
- automated testing

## Verification

The project has been verified with:

- `npm run build`
- `npm run lint`
- `backend: npm run check`

## License

This project is open for personal learning and portfolio use.
