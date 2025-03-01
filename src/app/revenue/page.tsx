"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Booking } from '../components/booking/Booking';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

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
  const [allBookings, setAllBookings] = useState<Booking[] | null>(null);
  const [allExpenses, setAllExpenses] = useState<Expense[] | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<'1M' | '6M' | '1Y'>('1M');
  const [projectionPeriod, setProjectionPeriod] = useState<'none' | '1M' | '6M' | '1Y'>('none');
  const [tableVisible, setTableVisible] = useState(true);

  // Fetch all bookings and expenses without date filters
  useEffect(() => {
    const fetchAllData = async () => {
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

        setAllBookings(bookings);
        setAllExpenses(expenses);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchAllData();
  }, []);

  // Process historical data based on selected date range
  useEffect(() => {
    if (allBookings && allExpenses) {
      const filteredBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.start_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return bookingDate >= start && bookingDate <= end;
      });

      const filteredExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return expenseDate >= start && expenseDate <= end;
      });

      const processedData = processFinancialData(filteredBookings, filteredExpenses, startDate, endDate);
      setFinancialData(processedData);
      setIsLoading(false);
    }
  }, [allBookings, allExpenses, startDate, endDate]);

  // Set default date range based on selected time period
  const getDateRange = (period: '1M' | '6M' | '1Y') => {
    const today = new Date();
    const start = new Date(today);
    switch (period) {
      case '1M': start.setMonth(today.getMonth() - 1); break;
      case '6M': start.setMonth(today.getMonth() - 6); break;
      case '1Y': start.setFullYear(today.getFullYear() - 1); break;
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

  // Process financial data for historical period
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

    const monthsInRange: Record<string, { prepaid: number; paid: number; revenue: number; bookings: number; expenses: number }> = {};
    const currentDate = new Date(start);
    currentDate.setDate(1);

    while (currentDate <= end) {
      const monthKey = currentDate.toLocaleString('default', { year: 'numeric', month: 'long' });
      monthsInRange[monthKey] = { prepaid: 0, paid: 0, revenue: 0, bookings: 0, expenses: 0 };
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const monthlyData = bookings.reduce((acc, booking) => {
      const monthKey = new Date(booking.start_date).toLocaleString('default', { year: 'numeric', month: 'long' });
      if (acc[monthKey]) {
        acc[monthKey].prepaid += booking.prepayment;
        acc[monthKey].paid += booking.amount - booking.prepayment;
        acc[monthKey].revenue += booking.amount;
        acc[monthKey].bookings += 1;
      }
      return acc;
    }, { ...monthsInRange });

    expenses.forEach(expense => {
      const monthKey = new Date(expense.date).toLocaleString('default', { year: 'numeric', month: 'long' });
      if (monthlyData[monthKey]) monthlyData[monthKey].expenses += expense.amount;
    });

    return {
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
  };

  // Helper function to get actual data for a specific month
  const getMonthlyData = (monthKey: string, bookings: Booking[], expenses: Expense[]) => {
    const [year, monthName] = monthKey.split(' ');
    const monthIndex = new Date(Date.parse(monthName + ' 1, ' + year)).getMonth();
    const startOfMonth = new Date(parseInt(year), monthIndex, 1);
    const endOfMonth = new Date(parseInt(year), monthIndex + 1, 0);

    const monthlyBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.start_date);
      return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
    });

    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    });

    const prepaid = monthlyBookings.reduce((sum, booking) => sum + booking.prepayment, 0);
    const revenue = monthlyBookings.reduce((sum, booking) => sum + booking.amount, 0);
    const paid = revenue - prepaid;
    const bookingsCount = monthlyBookings.length;
    const expensesSum = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    return { prepaid, paid, revenue, bookings: bookingsCount, expenses: expensesSum };
  };

  // Compute extended cash flow with projections using actual data only
  const extendedMonthlyCashFlow = useMemo(() => {
    if (!financialData || !allBookings || !allExpenses || projectionPeriod === 'none') {
      return financialData?.monthlyCashFlow.map(m => ({ ...m, isProjection: false })) || [];
    }

    const historical = financialData.monthlyCashFlow.map(m => ({ ...m, isProjection: false }));
    if (historical.length === 0) return historical;

    const lastHistoricalMonth = historical[historical.length - 1].month;
    const lastDate = new Date(lastHistoricalMonth + ' 1');
    lastDate.setMonth(lastDate.getMonth() + 1); // Start projections from the next month

    const projectionMonths = projectionPeriod === '1M' ? 1 : projectionPeriod === '6M' ? 6 : 12;
    const projectedData = [];

    for (let i = 0; i < projectionMonths; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + i);
      const monthKey = nextDate.toLocaleString('default', { year: 'numeric', month: 'long' });

      const actualData = getMonthlyData(monthKey, allBookings, allExpenses);

      const monthData = {
        month: monthKey,
        prepaid: actualData.prepaid,
        paid: actualData.paid,
        revenue: actualData.revenue,
        bookings: actualData.bookings,
        expenses: actualData.expenses,
        isProjection: true
      };

      projectedData.push(monthData);
    }

    return [...historical, ...projectedData];
  }, [financialData, allBookings, allExpenses, projectionPeriod]);

  // Export data to CSV
  const exportToCSV = () => {
    if (!extendedMonthlyCashFlow.length) return;

    const csvContent = [
      ['Month', 'Type', 'Bookings', 'Prepayment', 'Total Amount', 'Expenses'],
      ...extendedMonthlyCashFlow.map(month => [
        month.month,
        month.isProjection ? 'Projection' : 'Historical',
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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="flex gap-2">
          {['1M', '6M', '1Y'].map(period => (
            <button
              key={period}
              onClick={() => setTimePeriod(period as '1M' | '6M' | '1Y')}
              className={`px-4 py-2 rounded ${timePeriod === period ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {period === '1M' ? '1 Muaj' : period === '6M' ? '6 Muaj' : '1 Vjet'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['none', '1M', '6M', '1Y'].map(period => (
            <button
              key={period}
              onClick={() => setProjectionPeriod(period as 'none' | '1M' | '6M' | '1Y')}
              className={`px-4 py-2 rounded ${projectionPeriod === period ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {period === 'none' ? 'No Projection' : `Project ${period}`}
            </button>
          ))}
        </div>
        <div className="flex items-center">
          <label className="mr-2">Nga:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded p-2 w-full sm:w-auto"
          />
        </div>
        <div className="flex items-center">
          <label className="mr-2">Deri:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded p-2 w-full sm:w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Net Profiti</h3>
          <p className="text-2xl font-semibold text-green-600">{formatCurrency(financialData?.netProfit || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Parapagim</h3>
          <p className="text-2xl font-semibold text-blue-600">{formatCurrency(financialData?.totalPrepaid || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Paguar</h3>
          <p className="text-2xl font-semibold text-purple-600">{formatCurrency(financialData?.totalPaid || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Shpenzime</h3>
          <p className="text-2xl font-semibold text-red-600">{formatCurrency(financialData?.totalExpenses || 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Statistikat</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={extendedMonthlyCashFlow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value).replace('€', '') + '€'} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 'auto']}
                label={{ value: 'Rezervime', angle: -90, position: 'insideRight', offset: 20 }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip formatter={(value, name) => (name === 'Rezervime' ? value : formatCurrency(Number(value)))} />
              <Legend />
              {projectionPeriod !== 'none' && extendedMonthlyCashFlow.length > financialData!.monthlyCashFlow.length && (
                <ReferenceLine
                  x={extendedMonthlyCashFlow[financialData!.monthlyCashFlow.length].month}
                  stroke="gray"
                  label="Start of Projections"
                  yAxisId="left"
                />
              )}
              <Bar
                yAxisId="left"
                dataKey="revenue"
                name="Revenue"
                fill={(entry) => {
                  return entry.payload.isProjection ? 'rgba(255, 56, 92, 0.5)' : 'rgb(255, 56, 92)';
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="expenses"
                name="Expenses"
                fill={(entry) => {
                  return entry.payload.isProjection ? '#A9A9A9' : '#000000';
                }}
              />
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
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTableVisible(!tableVisible)}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          {tableVisible ? 'Fshih Tabelen' : 'Shfaq Tabelen'}
        </button>
        <button
          onClick={exportToCSV}
          disabled={!extendedMonthlyCashFlow.length}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Exporto CSV
        </button>
      </div>

      {tableVisible && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Kesh-Flow per periudhen</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Muaji</th>
                  <th className="text-right py-3 px-4">Parapagim</th>
                  <th className="text-right py-3 px-4">Per tPaguar</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-right py-3 px-4">Shpenzime</th>
                  <th className="text-right py-3 px-4">Lloji</th>
                </tr>
              </thead>
              <tbody>
                {extendedMonthlyCashFlow.map((monthData) => (
                  <tr key={monthData.month} className={`border-b ${monthData.isProjection ? 'bg-gray-100' : ''}`}>
                    <td className="text-left py-3 px-4">{monthData.month}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(monthData.prepaid)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(monthData.paid)}</td>
                    <td className="text-right py-3 px-4 font-medium">{formatCurrency(monthData.revenue)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(monthData.expenses)}</td>
                    <td className="text-right py-3 px-4">{monthData.isProjection ? 'Projektim' : 'Historik'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}