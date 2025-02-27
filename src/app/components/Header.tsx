"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Image from 'next/image';

const Header = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get the authenticated user's ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('profiles')
          .select('logo_url, company_name')
          .eq('user_id', user.id) // Match the authenticated user's ID
          .single(); // Assumes one profile per user

        if (error) throw error;

        setLogoUrl(data?.logo_url || null);
        setCompanyName(data?.company_name || 'Company Logo'); // Fallback if no company_name
      } catch (err) {
        setError('Failed to load profile data.');
        console.error('Error fetching profile:', err);
        setCompanyName('Company Logo'); // Default alt text on error
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-16 items-center">
          <Link href="/" className="flex-shrink-0">
            {loading ? (
              <span className="text-gray-500">Loading...</span>
            ) : logoUrl && !error ? (
              <Image
                src={logoUrl}
                alt={companyName || 'Company Logo'} // Dynamic alt text
                width={200}
                height={55}
                className="h-12 w-auto"
                onError={() => setLogoUrl(null)} // Fallback if image fails
              />
            ) : (
              <span className="text-2xl font-bold text-gray-900">{companyName || 'Logo'}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;