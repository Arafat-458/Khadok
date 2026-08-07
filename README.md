# Khadok

Khadok is a full-stack food ordering and e-commerce application. It provides product browsing, authentication, a shopping cart, order management, an admin area, and a chatbot experience through a React frontend and an Express/MongoDB backend.

## Project structure

```text
Khadok/
├── client/                         # React + Vite frontend
│   ├── public/                      # Static assets and product data
│   ├── src/
│   │   ├── components/              # Pages and reusable UI components
│   │   │   ├── Authentication/      # Login and registration
│   │   │   ├── Cart/                # Shopping cart
│   │   │   ├── Chatbot/             # Chatbot UI and logic
│   │   │   ├── Products/            # Product catalogue
│   │   │   └── firebase.init.jsx    # Firebase authentication setup
│   │   ├── App.jsx                  # Application routes and layout
│   │   └── main.jsx                 # React entry point
│   └── package.json
├── server/                          # Express API and MongoDB integration
│   ├── index.jsx                    # Server entry point and API routes
│   ├── addSampleMessages.js          # Sample-message helper
│   └── package.json
└── README.md
```

## Tech stack

### Frontend

- React 19 and Vite
- React Router
- Tailwind CSS and DaisyUI
- Firebase Authentication and Firestore
- `react-use-cart` for cart state
- ESLint

### Backend

- Node.js and Express
- MongoDB Node.js driver
- MongoDB / MongoDB Atlas
- dotenv for environment configuration
- CORS
- Nodemon for development

## Clone the repository

```bash
git clone https://github.com/Arafat-458/Khadok.git
cd Khadok
```

## Run the project

Open two terminals from the repository root.

### 1. Start the backend

```bash
cd server
npm install
```

Create a `server/.env` file and add your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

Then run the server:

```bash
npm run start-dev
```

The API runs at `http://localhost:5000` by default. You can check it at `http://localhost:5000/health`.

### 2. Start the frontend

```bash
cd client
npm install
npm run dev
```

Vite will show the local URL in the terminal, usually `http://localhost:5173`.

## Available commands

| Folder | Command | Purpose |
| --- | --- | --- |
| `client` | `npm run dev` | Start the frontend development server |
| `client` | `npm run build` | Create a production build |
| `client` | `npm run lint` | Run linting |
| `server` | `npm start` | Start the API server |
| `server` | `npm run start-dev` | Start the API server with Nodemon |

## Authors

- Turjo Chowdhury
- Arafat Rahman
- Sayed Shafin Mahmud
- Shahadath Hossain
