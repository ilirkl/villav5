"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Image from 'next/image';

const Header = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      const { data } = await supabase
        .from('company_profile')
        .select('logo_url')
        .single();
      setLogoUrl(data?.logo_url || null);
    };
    fetchLogo();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-16 items-center">
          <Link href="/" className="flex-shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Company Logo"
                width={200}
                height={80}
                className="h-20 w-auto"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-900">Logo</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;