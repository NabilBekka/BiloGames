import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'BiloGames - Play and prove your genius',
  description: 'Collection of brain games to test your intelligence',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
