"use client";

import './globals.css';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from './components/Header';
import Navbar from './components/Navbar';
import { supabase } from './supabaseClient';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <html lang="en">
        <body>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF385C]"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
        {!isLoginPage && isAuthenticated && <Header />}
        <div className={`min-h-screen bg-gray-50 ${!isLoginPage && isAuthenticated ? 'pb-20' : ''}`}>
          <main className={`${!isLoginPage && isAuthenticated ? 'max-w-7xl mx-auto pl-1 sm:px-6 lg:px-8 py-1' : ''}`}>
            {children}
          </main>
        </div>
        {!isLoginPage && isAuthenticated && <Navbar />}
      </body>
    </html>
  );
}
