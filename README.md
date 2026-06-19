# SwiftWait Heal - Smart Queue Management System

A MERN stack application for managing hospital and clinic queues in real-time.

## Project Structure

This project is divided into two main parts:

- **`backend/`**: Express.js API with MongoDB and Socket.io for real-time updates.
- **`frontend/`**: React application using TanStack Start (JSX) and Tailwind CSS.

## Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and configure your MongoDB URI
npm run seed
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Ensure .env has the correct VITE_API_URL (default: http://localhost:4000)
npm run dev
```

## Features
- Real-time queue tokens and estimated wait times.
- Patient dashboard for booking and tracking history.
- Doctor interface to manage the live queue.
- Admin panel for managing doctors, departments, and analytics.
- Real-time notifications via Socket.io.
