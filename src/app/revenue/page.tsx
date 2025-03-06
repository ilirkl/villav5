"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Booking } from '../components/booking/Booking';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const dynamic = 'force-dynamic';


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
    currency: 'EUR',
    minimumFractionDigits: 0, // No decimal places
    maximumFractionDigits: 0  // No decimal places
  }).format(amount);
};

export default function RevenuePage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<'1M' | '6M' | '1Y' | 'F1M' | 'F6M' | 'F1Y'>('1M');
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
    }  finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  const getDateRange = (period: '1M' | '6M' | '1Y' | 'F1M' | 'F6M' | 'F1Y') => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    
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
    // Future periods
    case 'F1M':
      end.setMonth(today.getMonth() + 1);
      break;
    case 'F6M':
      end.setMonth(today.getMonth() + 6);
      break;
    case 'F1Y':
      end.setFullYear(today.getFullYear() + 1);
      break;
  }
    
  return {
    start: period.startsWith('F') ? today.toISOString().split('T')[0] : start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
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
    const totalPaid = bookings.reduce((sum, booking) => sum + booking.amount, 0); 
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalPrepaid = bookings.reduce((sum, booking) => sum + booking.prepayment, 0);
    const netProfit = totalPaid - totalExpenses;

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
        year: '2-digit',
        month: 'short'
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
        year: '2-digit',
        month: 'short'
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
        year: '2-digit',
        month: 'short'
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
      <div className="mb-4 flex flex-wrap gap-2 max-w-[350px]">
        <div className="flex gap-2 mb-4">
        <select
    value={timePeriod}
    onChange={(e) => setTimePeriod(e.target.value as '1M' | '6M' | '1Y' | 'F1M' | 'F6M' | 'F1Y')}
    className="px-4 py-2 rounded bg-gray-200 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent w-full max-w-[350px]"
  >
    <optgroup label="E kaluar">
      <option value="1M">1 Muaj (E kaluar)</option>
      <option value="6M">6 Muaj (E kaluar)</option>
      <option value="1Y">1 Vjet (E kaluar)</option>
    </optgroup>
    <optgroup label="E ardhme">
      <option value="F1M">1 Muaj (E ardhme)</option>
      <option value="F6M">6 Muaj (E ardhme)</option>
      <option value="F1Y">1 Vjet (E ardhme)</option>
    </optgroup>
  </select>
  <div className="flex items-center gap-4 mb-4">
  <div className="flex items-center gap-4">
    <label className="mr-2 whitespace-nowrap">Nga:</label>
    <div className="relative w-2">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="border rounded p-2 opacity-0 absolute inset-0 w-full h-full cursor-pointer"
        onClick={(e) => e.currentTarget.showPicker()}
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          const input = e.currentTarget.previousSibling as HTMLInputElement;
          input.showPicker();
        }}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer"
        aria-label="Open date picker"
      >
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
  </div>

  <div className="flex items-center gap-4">
    <label className="mr-2 whitespace-nowrap">Deri:</label>
    <div className="relative w-2">
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="border rounded p-2 opacity-0 absolute inset-0 w-full h-full cursor-pointer"
        onClick={(e) => e.currentTarget.showPicker()}
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          const input = e.currentTarget.previousSibling as HTMLInputElement;
          input.showPicker();
        }}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer"
        aria-label="Open date picker"
      >
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
  </div>
</div>

   
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
            <AreaChart
  data={financialData.monthlyCashFlow}
  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  {/* Primary Y-axis for financial data (left side) */}
  <YAxis
    yAxisId="left"
    tickFormatter={(value) => `€${value}`} // Adjust formatting as needed
    label={{ value: 'Finance (EUR)', angle: -90, position: 'insideLeft' }}
  />
  {/* Secondary Y-axis for bookings count (right side) */}
  <YAxis
    yAxisId="right"
    orientation="right"
    label={{ value: 'Bookings Count', angle: 90, position: 'insideRight' }}
    domain={[0, 'dataMax + 1']} // Scales based on booking data
  />
  <Tooltip
    formatter={(value, name) => {
      if (name === 'Revenue' || name === 'Expenses') {
        return `€${value}`; // Format financial data as currency
      } else {
        return value; // Show bookings as plain numbers
      }
    }}
  />
  <Legend />
  {/* Revenue Area */}
  <Area
    type="monotone"
    dataKey="revenue"
    name="Revenue"
    stackId="1"
    stroke="#16a34a"
    fill="#16a34a"
    yAxisId="left"
  />
  {/* Expenses Area */}
  <Area
    type="monotone"
    dataKey="expenses"
    name="Expenses"
    stackId="0"
    stroke="#dc2626"
    fill="#dc2626"
    yAxisId="left"
  />
  {/* Bookings Area on secondary Y-axis */}
  <Area
    type="monotone"
    dataKey="bookings"
    name="Bookings"
    stroke="#9333ea"
    fill="none"
    yAxisId="right"
  />
</AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
      
<div className="flex items-center">
  
  
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
            <thead className="sticky top-0 bg-white z-10 border-b shadow-md">
              <tr className="border-b">
                <th className="text-right py-3 px-4">Muaji</th>
                <th className="text-right py-3 px-4">Rezervime</th>
                <th className="text-right py-3 px-4">Parapagim</th>
                <th className="text-right py-3 px-4">Per Pages</th>
                <th className="text-right py-3 px-4">Shpenzime</th>
                <th className="text-right py-3 px-4">Total</th>
              </tr>
            </thead>
            <tbody className="relative w-full max-h-96 overflow-y-auto border-t">
            {financialData?.monthlyCashFlow.map((monthData) => (
                  <tr key={monthData.month} className="border-b hover:bg-gray-50">
                  <td className="text-left py-3 px-4">{monthData.month}</td>
                  <td className="text-right py-3 px-4">{monthData.bookings}</td>
                  <td className="text-right py-3 px-4">{formatCurrency(monthData.prepaid)}</td>
                  <td className="text-right py-3 px-4">{formatCurrency(monthData.paid)}</td>
                  <td className="text-right py-3 px-4">{formatCurrency(monthData.expenses)}</td>
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