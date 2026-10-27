/**
 * Vercel Serverless Function entrypoint
 * Serves /api/* endpoints with server-side Supabase credentials.
 */

import express from 'express';
import { apiRouter } from '../src/server/supabaseBackend.js';

const app = express();
app.use(express.json());

// Monta o roteador da API
app.use('/api', apiRouter);

export default app;
