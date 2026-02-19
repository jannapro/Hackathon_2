import { createAuthClient } from "better-auth/react";

// No baseURL needed — Better Auth infers window.location.origin in the browser.
// process.env.BETTER_AUTH_URL is NOT NEXT_PUBLIC_ so it is undefined client-side;
// passing it here caused every auth call to target http://localhost:3000 in production.
export const authClient = createAuthClient({});

export const { signIn, signUp, signOut, useSession } = authClient;
