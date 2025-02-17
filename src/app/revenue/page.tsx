"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Booking } from '../components/Booking';

interface FinancialData {
  netProfit: number;
  totalPrepaid: number;
  totalPaid: number;
  totalExpenses: number;
  monthlyCashFlow: Array<{
    month: string;
    prepaid: number;
    paid: number;
  }>;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
  // Add other properties as needed
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export default function RevenuePage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchFinancialData = useCallback(async () => {
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('start_date', { ascending: true });

      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*');

      if (bookingsError) throw bookingsError;
      if (expensesError) throw expensesError;

      const filteredBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.start_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return (!startDate || bookingDate >= start) && (!endDate || bookingDate <= end);
      });

      const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return (!startDate || expenseDate >= start) && (!endDate || expenseDate <= end);
      });

      const processedData = processFinancialData(
        filteredBookings,
        filteredExpenses,
        startDate,
        endDate
      );
      setFinancialData(processedData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData, startDate, endDate]);

  const processFinancialData = (
    bookings: Booking[],
    expenses: Expense[],
    startDate: string,
    endDate: string
  ): FinancialData => {
    const netProfit = bookings.reduce((sum, booking) => sum + booking.amount, 0);
    const totalPrepaid = bookings.reduce((sum, booking) => sum + booking.prepayment, 0);
    const totalPaid = netProfit;
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Date range calculations
    const bookingDates = bookings.map(b => new Date(b.start_date).getTime());
    const start = startDate ? new Date(startDate) : new Date(Math.min(...bookingDates));
    const end = endDate ? new Date(endDate) : new Date(Math.max(...bookingDates));

    // Generate all months in range
    const monthsInRange: Record<string, { prepaid: number; paid: number }> = {};
    const currentDate = new Date(start);
    currentDate.setDate(1);

    while (currentDate <= end) {
      const monthKey = currentDate.toLocaleString('default', {
        year: 'numeric',
        month: 'long'
      });
      monthsInRange[monthKey] = { prepaid: 0, paid: 0 };
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Populate with booking data
    const monthlyData = bookings.reduce((acc, booking) => {
      const monthKey = new Date(booking.start_date).toLocaleString('default', {
        year: 'numeric',
        month: 'long'
      });

      if (acc[monthKey]) {
        acc[monthKey].prepaid += booking.prepayment;
        acc[monthKey].paid += booking.amount - booking.prepayment;
      }
      return acc;
    }, { ...monthsInRange });

    return {
      netProfit,
      totalPrepaid,
      totalPaid,
      totalExpenses,
      monthlyCashFlow: Object.entries(monthlyData).map(([month, amounts]) => ({
        month,
        prepaid: amounts.prepaid,
        paid: amounts.paid
      }))
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Date Filter Inputs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex items-center">
          <label className="mr-2">Nga:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded p-2"
          />
        </div>
        <div className="flex items-center">
          <label className="mr-2">Deri:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded p-2"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Net Profiti</h3>
          <p className="text-2xl font-semibold text-green-600">
            {formatCurrency(financialData?.netProfit || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Parapagim</h3>
          <p className="text-2xl font-semibold text-blue-600">
            {formatCurrency(financialData?.totalPrepaid || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Paguar</h3>
          <p className="text-2xl font-semibold text-purple-600">
            {formatCurrency(financialData?.totalPaid || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Shpenzime</h3>
          <p className="text-2xl font-semibold text-red-600">
            {formatCurrency(financialData?.totalExpenses || 0)}
          </p>
        </div>
      </div>

      {/* Monthly Cash Flow */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Kesh-Flow per periudhen</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-4">Parapagim</th>
                <th className="text-right py-3 px-4">Per tPaguar</th>
                <th className="text-right py-3 px-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {financialData?.monthlyCashFlow.map((monthData) => (
                <tr key={monthData.month} className="border-b hover:bg-gray-50">
                  <td className="text-left py-3 px-4">{monthData.month}</td>
                  <td className="text-right py-3 px-4">{formatCurrency(monthData.prepaid)}</td>
                  <td className="text-right py-3 px-4">{formatCurrency(monthData.paid)}</td>
                  <td className="text-right py-3 px-4 font-medium">
                    {formatCurrency(monthData.prepaid + monthData.paid)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}