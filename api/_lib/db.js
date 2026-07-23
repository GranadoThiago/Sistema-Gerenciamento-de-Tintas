// Usa a variável de ambiente POSTGRES_URL, criada automaticamente pela Vercel
// quando você adiciona o armazenamento "Postgres" (Neon) ao projeto.
const { sql } = require('@vercel/postgres');

module.exports = { sql };
