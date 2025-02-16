import React from 'react';
import Expense from '../components/Expense';

export default function ExpensesPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-1">
            <div className="max-w-7xl mx-auto">
                
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                        <Expense />
                    </div>
                </div>
            </div>
        </div>
    );
}
