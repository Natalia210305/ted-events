import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// Φορτώνουμε το .env αρχείο
dotenv.config();

export default defineConfig({
  datasource: {
    // Χρησιμοποιούμε απευθείας την τιμή από το .env
    url: process.env.DATABASE_URL,
  },
});