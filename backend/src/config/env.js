const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is not set.\n' +
    'Please copy .env.example to .env and define a cryptographically secure JWT_SECRET.\n' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
}

const isPlaceholder = JWT_SECRET.startsWith('replace_with') || JWT_SECRET.includes('replace_with');
const isTooShort = JWT_SECRET.length < 32;

if (process.env.NODE_ENV === 'production') {
  if (isPlaceholder || isTooShort) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: Insecure JWT_SECRET detected in production environment.\n' +
      'Secret must not use the default placeholder and must be at least 32 characters.\n' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }
} else if (isPlaceholder || isTooShort) {
  console.warn(
    '\x1b[33m%s\x1b[0m',
    '⚠️  [SECURITY WARNING] Insecure or placeholder JWT_SECRET detected in development.\n' +
    '   Please generate a strong key (min 32 chars) for .env:\n' +
    '   node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
}

// In production the database password must be supplied explicitly (no silent 'postgres' fallback)
if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
  throw new Error('FATAL CONFIGURATION ERROR: DB_PASSWORD environment variable is required in production.');
}

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_NAME: process.env.DB_NAME || 'bm_task_manager',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_SSL: process.env.DB_SSL === 'true',
};
