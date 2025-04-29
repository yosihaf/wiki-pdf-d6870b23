import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6807a9c4c3146830d6870b23", 
  requiresAuth: true // Ensure authentication is required for all operations
});
