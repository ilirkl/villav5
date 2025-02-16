import React from 'react';
import Booking from '../components/Booking';

export default function BookingsPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-7xl mx-auto">
                               <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-1">
                        <Booking />
                    </div>
                </div>
            </div>
        </div>
    );
}
