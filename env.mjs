/**
 * Environment configuration for runtime variables
 * Validates that required environment variables are set at build and runtime
 */

const requiredEnvVars = ['NEXT_PUBLIC_YOUTUBE_API_KEY'];

/**
 * Validates required environment variables
 * @throws {Error} If any required environment variable is missing
 */
function validateEnv() {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file or environment configuration.'
    );
  }
}

/**
 * Get environment configuration
 * @returns {Object} Environment variables object
 */
export function getEnv() {
  validateEnv();

  return {
    youtubeApiKey: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
  };
}

// Validate on import in non-production environments
if (process.env.NODE_ENV !== 'production') {
  try {
    validateEnv();
  } catch (error) {
    console.warn(
      'Environment validation warning (non-production mode):',
      error.message
    );
  }
}
