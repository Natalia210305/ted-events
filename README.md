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

1. «Πώς λειτουργεί ο αλγόριθμος Biased Matrix Factorization που γράψατε;»Απάντηση: «Κύριε καθηγητή, ο αλγόριθμος προσπαθεί να προβλέψει ένα σκορ προτιμήσεων υπολογίζοντας τρεις παράγοντες: τον καθολικό μέσο όρο (μ), το User Bias (b_u) που δείχνει αν ένας χρήστης είναι πολύ επιλεκτικός ή όχι, και το Item Bias (b_i) που δείχνει τη γενική δημοφιλία μιας εκδήλωσης. Επιπλέον, "σπάει" τον μεγάλο πίνακα αλληλεπιδράσεων σε δύο μικρότερους πίνακες κρυφών χαρακτηριστικών (Latent Factors), τον P για τους χρήστες και τον Q για τις εκδηλώσεις. Η εκπαίδευση των πινάκων έγινε "από το μηδέν" με τη μέθοδο Stochastic Gradient Descent (SGD), διορθώνοντας το σφάλμα (error) σε κάθε epoch.»  
2. «Πώς μετατρέψατε τα δεδομένα των CSV σε Ratings (Βαθμολογίες);»Απάντηση: «Επειδή δεν είχαμε ρητή βαθμολογία (explicit ratings, π.χ. αστέρια 1-5), χρησιμοποιήσαμε τη λογική του Implicit Feedback (έμμεση αλληλεπίδραση). Αντιστοιχίσαμε τις ενέργειες των χρηστών σε ένα κοινό σκορ: Αν ένας χρήστης δήλωσε 'not_interested' δίνουμε σκορ 1, αν έκανε απλό κλικ/προβολή δίνουμε 3, αν δήλωσε 'interested' δίνουμε 4, και αν πραγματοποίησε οριστική κράτηση (status 'CONFIRMED' ή 'yes') δίνουμε το μέγιστο σκορ 5.»  
3. «Πώς αντιμετωπίσατε το πρόβλημα του Cold Start (Νέος Χρήστης);»Απάντηση: «Αν ένας χρήστης είναι ολοκαίνουργιος και το ID του δεν υπάρχει στα ιστορικά δεδομένα εκπαίδευσης, ο αλγόριθμος το αναγνωρίζει αυτόματα. Αντί να κρασάρει ή να επιστρέψει σφάλμα, εφαρμόζει μια fallback στρατηγική: μετράει ποιες εκδηλώσεις έχουν τις περισσότερες κρατήσεις στο σύστημα και προτείνει στον χρήστη τα Top-5 πιο δημοφιλή events της πλατφόρμας.»