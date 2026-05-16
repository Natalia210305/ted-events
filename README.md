# TED Events - Εφαρμογή Διαχείρισης Εκδηλώσεων

## Προαπαιτούμενα
Πριν ξεκινήσεις, εγκατέστησε τα εξής:
- [Node.js](https://nodejs.org/) (έκδοση 18+)
- [PostgreSQL](https://www.postgresql.org/download/) (έκδοση 18)
- [pgAdmin 4](https://www.pgadmin.org/download/)

## Εγκατάσταση

### 1. Κλωνοποίηση του repository
```bash
git clone https://github.com/ΟΝΟΜΑ_ΧΡΗΣΤΗ/ted-events.git
cd ted-events
```

### 2. Ρύθμιση Backend
```bash
cd backend
npm install
```

Φτιάξε το αρχείο `.env` μέσα στο φάκελο `backend/`: DATABASE_URL="postgresql://postgres:ΤΟ_PASSWORD_ΣΟΥ@localhost:5432/ted_events"
JWT_SECRET="ted_events_secret_key_2026"
PORT=3000

### 3. Ρύθμιση Βάσης Δεδομένων
Άνοιξε το pgAdmin και δημιούργησε μια νέα βάση με όνομα `ted_events`.

Μετά τρέξε:
```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Δημιουργία Admin χρήστη
```bash
node prisma/seed.js
```

Τα στοιχεία του admin είναι:
- Username: `admin`
- Password: `admin123`

### 5. Εκκίνηση Backend
```bash
node src/index.js
```
Ο server τρέχει στο http://localhost:3000

### 6. Ρύθμιση Frontend
Άνοιξε νέο terminal:
```bash
cd frontend
npm install
npm run dev
```
Η εφαρμογή ανοίγει στο http://localhost:5173

## Χρήση
- **Admin**: username `admin`, password `admin123`
- Νέοι χρήστες εγγράφονται και αναμένουν έγκριση από τον Admin

## Τεχνολογίες
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Frontend**: React, Vite, Axios, React Router
- **Auth**: JWT