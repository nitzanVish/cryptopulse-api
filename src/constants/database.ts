/**
 * Database configuration constants
 */

export const DATABASE_CONFIG = {
  CONNECTION: {
    MAX_POOL_SIZE: 10,
    SERVER_SELECTION_TIMEOUT_MS: 5000,
    SOCKET_TIMEOUT_MS: 45000,
  },
} as const;
