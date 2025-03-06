"use client";

import React from 'react';
import SeasonalPricingSettings from '../components/settings/SeasonalPricingSettings';
import ProfileSettings from '../components/settings/ProfileSettings';
import { supabase } from '../../utils/supabaseClient';

export const dynamic = 'force-dynamic';
export default function SettingsPage() {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // The layout's auth state listener will handle redirection to /login
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Ndodhi një gabim gjatë daljes. Ju lutemi provoni përsëri.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Konfiguro</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[#FF385C] text-white rounded-md hover:bg-[#FF385C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF385C]"
          >
            Dil
          </button>
        </div>
        <div className="space-y-6">
          <ProfileSettings />
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Cmime Sezonale</h2>
            <SeasonalPricingSettings />
          </div>
        </div>
      </div>
    </div>
  );
}