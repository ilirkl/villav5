"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Navigation - Top */}
      <nav className="hidden sm:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <span className="text-[#FF385C] text-xl font-bold">VillaStay</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/bookings">
                <span className="text-gray-700 hover:text-[#FF385C] px-3 py-2 rounded-full text-sm font-medium transition-colors">
                  Bookings
                </span>
              </Link>
              <Link href="/expenses">
                <span className="text-gray-700 hover:text-[#FF385C] px-3 py-2 rounded-full text-sm font-medium transition-colors">
                  Expenses
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className="flex flex-col items-center justify-center w-full">
            <div className={`flex flex-col items-center justify-center ${pathname === '/' ? 'text-[#FF385C]' : 'text-gray-500'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs mt-1">Home</span>
            </div>
          </Link>
          
          <Link href="/bookings" className="flex flex-col items-center justify-center w-full">
            <div className={`flex flex-col items-center justify-center ${pathname === '/bookings' ? 'text-[#FF385C]' : 'text-gray-500'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs mt-1">Bookings</span>
            </div>
          </Link>
          
          <Link href="/expenses" className="flex flex-col items-center justify-center w-full">
            <div className={`flex flex-col items-center justify-center ${pathname === '/expenses' ? 'text-[#FF385C]' : 'text-gray-500'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs mt-1">Expenses</span>
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
