'use client';

import { DrawingProvider } from './context/DrawingContext';
import Navigation from './components/Navigation';

export default function ClientApp({ children }) {
  return (
    <DrawingProvider>
      <Navigation />
      <main className="h-[calc(100vh-4rem)]">
        {children}
      </main>
    </DrawingProvider>
  );
}
