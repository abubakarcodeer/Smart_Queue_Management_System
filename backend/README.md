# Smart Queue — Backend (Express + MongoDB + Socket.io)

## Setup

```bash
cd backend
cp .env.example .env       # edit MONGO_URI + JWT_SECRET
npm install
npm run seed               # creates demo admin/doctor/patient + 1 department
npm run dev                # starts on http://localhost:4000
```

Then in the `frontend` directory:

```bash
# Ensure VITE_API_URL points to the backend
echo "VITE_API_URL=http://localhost:4000" >> .env
```

## Demo accounts (after `npm run seed`)

| Role    | Email                   | Password   |
|---------|-------------------------|------------|
| Admin   | admin@clinic.test       | admin123   |
| Doctor  | doctor@clinic.test      | doctor123  |
| Patient | patient@clinic.test     | patient123 |

## API

All routes are under `/api`. Auth via `Authorization: Bearer <token>`.

- `POST /api/auth/register` – patient self-signup
- `POST /api/auth/login`
- `GET  /api/auth/me`
- `GET  /api/departments`
- `POST /api/departments` (admin)
- `GET  /api/doctors`
- `POST /api/doctors` (admin)
- `PATCH /api/doctors/:id/availability` (doctor/admin)
- `POST /api/appointments` (patient) – books appointment + issues queue token
- `GET  /api/appointments/me` (patient)
- `GET  /api/queue/:doctorId` – live queue for a doctor (today)
- `POST /api/queue/:doctorId/next` (doctor) – call next
- `POST /api/queue/token/:tokenId/complete` (doctor)
- `POST /api/queue/token/:tokenId/skip` (doctor)
- `GET  /api/admin/analytics` (admin)
- `GET  /api/notifications/me`

## Realtime (Socket.io)

Connect to the server URL and join rooms:
- `join:queue` with `{ doctorId }` → receives `queue:update` events
- `join:user`  with `{ userId }`   → receives `notification:new` events
