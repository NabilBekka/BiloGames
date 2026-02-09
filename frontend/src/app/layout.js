'use client';

import '../styles/globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>BiloGames - Play and prove your genius</title>
        <meta name="description" content="Collection of brain games to test your intelligence" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
