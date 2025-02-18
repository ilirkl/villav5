"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Booking } from '../components/Booking';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialData {
  netProfit: number;
  totalPrepaid: number;
  totalPaid: number;
  totalExpenses: number;
  bookingsCount: number;
  monthlyCashFlow: Array<{
    month: string;
    prepaid: number;
    paid: number;
    revenue: number;
    bookings: number;
    expenses: number;
  }>;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
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
  const [timePeriod, setTimePeriod] = useState<'1M' | '6M' | '1Y'>('1M');
  const [tableVisible, setTableVisible] = useState(true);

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

  const getDateRange = (period: '1M' | '6M' | '1Y') => {
    const today = new Date();
    const start = new Date(today);
    
    switch(period) {
      case '1M':
        start.setMonth(today.getMonth() - 1);
        break;
      case '6M':
        start.setMonth(today.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(today.getFullYear() - 1);
        break;
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    const { start, end } = getDateRange(timePeriod);
    setStartDate(start);
    setEndDate(end);
  }, [timePeriod]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData, startDate, endDate]);

  const exportToCSV = () => {
    if (!financialData) return;
    
    const csvContent = [
      ['Month', 'Bookings', 'Prepayment', 'Total Amount', 'Expenses'],
      ...financialData.monthlyCashFlow.map(month => [
        month.month,
        month.bookings,
        month.prepaid,
        month.revenue,
        month.expenses
      ])
    ]
    .map(row => row.join(','))
    .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `revenue-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

    const bookingDates = bookings.map(b => new Date(b.start_date).getTime());
    const start = startDate ? new Date(startDate) : new Date(Math.min(...bookingDates));
    const end = endDate ? new Date(endDate) : new Date(Math.max(...bookingDates));

    const monthsInRange: Record<string, { 
      prepaid: number; 
      paid: number;
      revenue: number;
      bookings: number;
      expenses: number; 
    }> = {};

    const currentDate = new Date(start);
    currentDate.setDate(1);

    while (currentDate <= end) {
      const monthKey = currentDate.toLocaleString('default', {
        year: 'numeric',
        month: 'long'
      });
      monthsInRange[monthKey] = { 
        prepaid: 0, 
        paid: 0,
        revenue: 0,
        bookings: 0,
        expenses: 0 
      };
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const monthlyData = bookings.reduce((acc, booking) => {
      const monthKey = new Date(booking.start_date).toLocaleString('default', {
        year: 'numeric',
        month: 'long'
      });

      if (acc[monthKey]) {
        acc[monthKey].prepaid += booking.prepayment;
        acc[monthKey].paid += booking.amount - booking.prepayment;
        acc[monthKey].revenue += booking.amount;
        acc[monthKey].bookings += 1;
      }
      return acc;
    }, { ...monthsInRange });

    expenses.forEach(expense => {
      const monthKey = new Date(expense.date).toLocaleString('default', {
        year: 'numeric',
        month: 'long'
      });
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].expenses += expense.amount;
      }
    });

    const result = {
      netProfit,
      totalPrepaid,
      totalPaid,
      totalExpenses,
      bookingsCount: bookings.length,
      monthlyCashFlow: Object.entries(monthlyData).map(([month, amounts]) => ({
        month,
        prepaid: amounts.prepaid,
        paid: amounts.paid,
        revenue: amounts.revenue,
        bookings: amounts.bookings,
        expenses: amounts.expenses
      }))
    };
    console.log('Processed financial data:', result);
    return result;
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
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setTimePeriod('1M')}
            className={`px-4 py-2 rounded ${timePeriod === '1M' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            1 Muaj
          </button>
          <button 
            onClick={() => setTimePeriod('6M')}
            className={`px-4 py-2 rounded ${timePeriod === '6M' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            6 Muaj
          </button>
          <button 
            onClick={() => setTimePeriod('1Y')}
            className={`px-4 py-2 rounded ${timePeriod === '1Y' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            1 Vjet
          </button>
        </div>

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

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Statistikat</h2>
        <div className="h-96">
          {financialData && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData.monthlyCashFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(value) => formatCurrency(value).replace('€', '') + '€'}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  domain={[0, 'auto']}
                  label={{ 
                    value: 'Rezervime', 
                    angle: -90,
                    position: 'insideRight',
                    offset: 20
                  }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  formatter={(value, name) => 
                    name === 'Rezervime' ? value : formatCurrency(Number(value))
                  }
                />
                <Legend />
                <Line
                  yAxisId="right"
                  type="monotone" 
                  dataKey="bookings" 
                  name="Rezervime" 
                  stroke="#9333ea"
                  strokeWidth={6}
                  strokeOpacity={0.8}
                  dot={{ fill: '#9333ea', strokeWidth: 2, r: 8 }}
                  animationDuration={300}
                  strokeDasharray="5 5"
                />
                <Bar 
                  yAxisId="left"
                  dataKey="revenue" 
                  name="Revenue" 
                  fill="#16a34a" 
                />
                <Bar 
                  yAxisId="left"
                  dataKey="expenses" 
                  name="Shpenzime" 
                  fill="#dc2626" 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button 
          onClick={() => setTableVisible(!tableVisible)}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
          {tableVisible ? 'Fshih Tabelen' : 'Shfaq Tabelen'}
        </button>
        <button 
          onClick={exportToCSV}
          disabled={!financialData}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
          Exporto CSV
        </button>
      </div>


      <div className={`bg-white rounded-lg shadow p-6 ${!tableVisible && 'hidden'}`}>
        <h2 className="text-xl font-semibold mb-4">Kesh-Flow per periudhen</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-4">Muaji</th>
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
