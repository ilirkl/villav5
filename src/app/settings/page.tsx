"use client";

import React from 'react';
import SeasonalPricingSettings from '../components/SeasonalPricingSettings';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-6">Konfiguro</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-medium text-gray-900 mb-4">Cmime Sezonale</h2>
                    <SeasonalPricingSettings />
                </div>
            </div>
        </div>
    );
}
