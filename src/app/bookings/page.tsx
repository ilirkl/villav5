import React from 'react';
import Booking from '../components/Booking';

export default function BookingsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-8">
            <div className="max-w-7xl mx-auto">
                               <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                        <Booking />
                    </div>
                </div>
            </div>
        </div>
    );
}
