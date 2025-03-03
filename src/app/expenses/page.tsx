import React from 'react';
import Expense from '../components/expense/Expense';

export default function ExpensesPage() {
    return (
        <div className="min-h-screen bg-gray-50 pl-0">
            <div className="max-w-7xl mx-auto pl-0">
                
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                        <Expense />
                    </div>
                </div>
            </div>
        </div>
    );
}
