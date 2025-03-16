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

// ### Interfaces
interface FinancialData {
  netProfit: number;
  totalPrepaid: number;
  totalPaid: number;
  totalExpenses: number;
  bookingsCount: number;
  overallOccupancy: number;
  totalDaysBooked: number;
  totalDirektRevenue: number;      // Total revenue from Direkt
  totalAirbnbRevenue: number;      // Total revenue from Airbnb
  totalBookingRevenue: number;     // Total revenue from Booking
  monthlyCashFlow: Array<{
    month: string;
    prepaid: number;
    paid: number;
    revenue: number;
    bookings: number;
    expenses: number;
    occupancy: number;
    daysBooked: number;
    netProfit: number;
    direktRevenue: number;         // Monthly revenue from Direkt
    airbnbRevenue: number;         // Monthly revenue from Airbnb
    bookingRevenue: number;        // Monthly revenue from Booking
  }>;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
}

// ### Utility Functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ### Main Component
export default function RevenuePage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<'1M' | '6M' | '1Y' | 'F1M' | 'F6M' | 'F1Y'>('1M');
  const [tableVisible, setTableVisible] = useState(true);

  // Fetch financial data from Supabase
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

      const start = startDate ? new Date(startDate) : new Date(Math.min(...bookings.map(b => new Date(b.start_date).getTime())));
      const end = endDate ? new Date(endDate) : new Date(Math.max(...bookings.map(b => new Date(b.start_date).getTime())));

      const overlappingBookings = bookings.filter(booking => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        return bookingEnd > start && bookingStart < end;
      });

      const startingBookings = bookings.filter(booking => {
        const bookingStart = new Date(booking.start_date);
        return bookingStart >= start && bookingStart <= end;
      });

      const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= start && expenseDate <= end;
      });

      const processedData = processFinancialData(
        startingBookings,
        filteredExpenses,
        overlappingBookings,
        start,
        end
      );
      setFinancialData(processedData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  // Determine date range based on selected time period
  const getDateRange = (period: '1M' | '6M' | '1Y' | 'F1M' | 'F6M' | 'F1Y') => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    switch (period) {
      case '1M':
        start.setMonth(today.getMonth() - 1);
        break;
      case '6M':
        start.setMonth(today.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(today.getFullYear() - 1);
        break;
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
      end: end.toISOString().split('T')[0],
    };
  };

  // Update date range when time period changes
  useEffect(() => {
    const { start, end } = getDateRange(timePeriod);
    setStartDate(start);
    setEndDate(end);
  }, [timePeriod]);

  // Fetch data when date range changes
  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  // Export data to CSV
  const exportToCSV = () => {
    if (!financialData) return;

    const csvContent = [
      [
        'Month',
        'Bookings',
        'Prepayment',
        'Total Amount',
        'Expenses',
        'Net Profit',
        'Occupancy %',
        'Days Booked',
        '% Direkt',    // Percentage of revenue from Direkt
        '% Airbnb',    // Percentage of revenue from Airbnb
        '% Booking',   // Percentage of revenue from Booking
      ],
      ...financialData.monthlyCashFlow.map(month => [
        month.month,
        month.bookings,
        month.prepaid,
        month.revenue,
        month.expenses,
        month.netProfit,
        month.occupancy.toFixed(2),
        month.daysBooked,
        month.revenue > 0 ? ((month.direktRevenue / month.revenue) * 100).toFixed(1) : 0,
        month.revenue > 0 ? ((month.airbnbRevenue / month.revenue) * 100).toFixed(1) : 0,
        month.revenue > 0 ? ((month.bookingRevenue / month.revenue) * 100).toFixed(1) : 0,
      ]),
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

  // Process financial data
  const processFinancialData = (
    financialBookings: Booking[],
    expenses: Expense[],
    occupancyBookings: Booking[],
    start: Date,
    end: Date
  ): FinancialData => {
    const totalPaid = financialBookings.reduce((sum, booking) => sum + booking.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalPrepaid = financialBookings.reduce((sum, booking) => sum + booking.prepayment, 0);
    const netProfit = totalPaid - totalExpenses;

    const months = getMonthsBetween(start, end);

    // Initialize monthly data with source revenues
    const monthlyData = months.map(month => ({
      month: month.monthKey,
      prepaid: 0,
      paid: 0,
      revenue: 0,
      bookings: 0,
      expenses: 0,
      occupancy: 0,
      daysBooked: 0,
      netProfit: 0,
      direktRevenue: 0,      // Monthly revenue from Direkt
      airbnbRevenue: 0,      // Monthly revenue from Airbnb
      bookingRevenue: 0,     // Monthly revenue from Booking
      relevantStart: month.monthStart,
      relevantEnd: month.monthEnd,
    }));

    // Track total revenues by source
    let totalDirektRevenue = 0;
    let totalAirbnbRevenue = 0;
    let totalBookingRevenue = 0;

    // Process bookings and accumulate revenues
    financialBookings.forEach(booking => {
      const bookingMonth = new Date(booking.start_date).toLocaleString('default', {
        year: '2-digit',
        month: 'short',
      });
      const monthData = monthlyData.find(m => m.month === bookingMonth);
      if (monthData) {
        monthData.prepaid += booking.prepayment;
        monthData.paid += booking.amount - booking.prepayment;
        monthData.revenue += booking.amount;
        monthData.bookings += 1;

        // Accumulate revenue by source
        if (booking.source === 'Direkt') {
          monthData.direktRevenue += booking.amount;
          totalDirektRevenue += booking.amount;
        } else if (booking.source === 'Airbnb') {
          monthData.airbnbRevenue += booking.amount;
          totalAirbnbRevenue += booking.amount;
        } else if (booking.source === 'Booking') {
          monthData.bookingRevenue += booking.amount;
          totalBookingRevenue += booking.amount;
        }
      }
    });

    // Process expenses
    expenses.forEach(expense => {
      const expenseMonth = new Date(expense.date).toLocaleString('default', {
        year: '2-digit',
        month: 'short',
      });
      const monthData = monthlyData.find(m => m.month === expenseMonth);
      if (monthData) {
        monthData.expenses += expense.amount;
      }
    });

    // Calculate occupancy and net profit per month
    monthlyData.forEach(month => {
      const { percentage, daysBooked } = calculateOccupancy(occupancyBookings, month.relevantStart, month.relevantEnd);
      month.occupancy = percentage;
      month.daysBooked = daysBooked;
      month.netProfit = month.revenue - month.expenses;
    });

    const { percentage: overallOccupancy, daysBooked: totalDaysBooked } = calculateOccupancy(occupancyBookings, start, end);

    return {
      netProfit,
      totalPrepaid,
      totalPaid,
      totalExpenses,
      bookingsCount: financialBookings.length,
      overallOccupancy,
      totalDaysBooked,
      totalDirektRevenue,
      totalAirbnbRevenue,
      totalBookingRevenue,
      monthlyCashFlow: monthlyData.map(month => ({
        month: month.month,
        prepaid: month.prepaid,
        paid: month.paid,
        revenue: month.revenue,
        bookings: month.bookings,
        expenses: month.expenses,
        occupancy: month.occupancy,
        daysBooked: month.daysBooked,
        netProfit: month.netProfit,
        direktRevenue: month.direktRevenue,
        airbnbRevenue: month.airbnbRevenue,
        bookingRevenue: month.bookingRevenue,
      })),
    };
  };

  // Helper function to get months between dates
  function getMonthsBetween(start: Date, end: Date) {
    const months = [];
    const current = new Date(start);
    current.setDate(1);
    while (current <= end) {
      const monthStart = new Date(Math.max(current.getTime(), start.getTime()));
      const monthEnd = new Date(Math.min(new Date(current.getFullYear(), current.getMonth() + 1, 0).getTime(), end.getTime()));
      const monthKey = current.toLocaleString('default', { year: '2-digit', month: 'short' });
      months.push({ monthKey, monthStart, monthEnd });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }

  // Calculate occupancy percentage and days booked
  function calculateOccupancy(bookings: Booking[], relevantStart: Date, relevantEnd: Date): { percentage: number, daysBooked: number } {
    const occupiedDays = new Set<string>();
    bookings.forEach(booking => {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      const intersectionStart = new Date(Math.max(bookingStart.getTime(), relevantStart.getTime()));
      const intersectionEnd = new Date(Math.min(bookingEnd.getTime(), relevantEnd.getTime() + 86400000));
      for (let day = new Date(intersectionStart); day < intersectionEnd; day.setDate(day.getDate() + 1)) {
        if (day >= bookingStart && day < bookingEnd) {
          occupiedDays.add(day.toDateString());
        }
      }
    });
    const totalDays = Math.ceil((relevantEnd.getTime() - relevantStart.getTime()) / 86400000) + 1;
    const daysBooked = occupiedDays.size;
    const percentage = totalDays > 0 ? (daysBooked / totalDays) * 100 : 0;
    return { percentage, daysBooked };
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading financial data...</p>
      </div>
    );
  }

  // Main render
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Date Range Selection */}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Occupancy</h3>
          <p className="text-2xl font-semibold text-blue-600">
            {financialData?.overallOccupancy.toFixed(0)}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Dite</h3>
          <p className="text-2xl font-semibold text-yellow-600">
            {financialData?.totalDaysBooked || 0}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Statistikat</h2>
        <div className="h-96">
          {financialData && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData.monthlyCashFlow} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" tickFormatter={(value) => `€${value}`} label={{ value: 'Finance (EUR)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Counts', angle: 90, position: 'insideRight' }} domain={[0, 'dataMax + 1']} />
                <YAxis yAxisId="occupancy" orientation="right" hide={true} label={{ value: 'Occupancy %', angle: 90, position: 'insideRight' }} domain={[0, 100]} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'Revenue' || name === 'Expenses') {
                    return `€${value}`;
                  } else if (name === 'Occupancy') {
                    return `${Number(value).toFixed(1)}%`;
                  } else {
                    return value;
                  }
                }} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stackId="1" stroke="#16a34a" fill="#16a34a" yAxisId="left" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stackId="0" stroke="#dc2626" fill="#dc2626" yAxisId="left" />
                <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#9333ea" fill="none" yAxisId="right" />
                <Area type="monotone" dataKey="occupancy" name="Occupancy" stroke="#3b82f6" fill="none" yAxisId="occupancy" />
                <Area type="monotone" dataKey="daysBooked" name="Days Booked" stroke="#eab308" fill="none" yAxisId="right" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Table Controls */}
      <div className="mb-4 flex gap-2">
        <button onClick={() => setTableVisible(!tableVisible)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
          {tableVisible ? 'Fshih Tabelen' : 'Shfaq Tabelen'}
        </button>
        <button onClick={exportToCSV} disabled={!financialData} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
          Exporto CSV
        </button>
      </div>

      {/* Monthly Cash Flow Table */}
      <div className={`bg-white rounded-lg shadow p-6 ${!tableVisible && 'hidden'}`}>
        <h2 className="text-xl font-semibold mb-4">Kesh-Flow</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10 border-b shadow-md">
              <tr className="border-b">
                <th className="text-right py-3 px-4">Muaji</th>
                <th className="text-right py-3 px-4">Rezervime</th>
                <th className="text-right py-3 px-4">Dite</th>
                <th className="text-right py-3 px-4">Occupancy</th>
                <th className="text-right py-3 px-4">Parapagim</th>
                <th className="text-right py-3 px-4">Paguar</th>
                <th className="text-right py-3 px-4">Shpenzime</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-right py-3 px-4">Fitimi</th>
                <th className="text-right py-3 px-4">% Direkt</th>
                <th className="text-right py-3 px-4">% Airbnb</th>
                <th className="text-right py-3 px-4">% Booking</th>
              </tr>
            </thead>
            <tbody className="relative w-full max-h-96 overflow-y-auto border-t">
              {financialData?.monthlyCashFlow.map((monthData) => (
                <tr key={monthData.month} className="border-b hover:bg-gray-50">
                  <td className="text-left py-3 px-4">{monthData.month}</td>
                  <td className="text-right py-3 px-4">{monthData.bookings}</td>
                  <td className="text-right py-3 px-4">{monthData.daysBooked}</td>
                  <td className="text-right py-3 px-4">{monthData.occupancy.toFixed(2)}%</td>
                  <td className="text-right py-3 px-4">{formatCurrency(monthData.prepaid)}</td>
                  <td className="text-right py-3 px-4">{formatCurrency(monthData.paid)}</td>
                  <td className="text-right py-3 px-4">{formatCurrency(monthData.expenses)}</td>
                  <td className="text-right py-3 px-4 font-medium">{formatCurrency(monthData.prepaid + monthData.paid)}</td>
                  <td className="text-right py-3 px-4 font-medium">{formatCurrency(monthData.netProfit)}</td>
                  <td className="text-right py-3 px-4">
                    {monthData.revenue > 0 ? ((monthData.direktRevenue / monthData.revenue) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="text-right py-3 px-4">
                    {monthData.revenue > 0 ? ((monthData.airbnbRevenue / monthData.revenue) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="text-right py-3 px-4">
                    {monthData.revenue > 0 ? ((monthData.bookingRevenue / monthData.revenue) * 100).toFixed(1) : 0}%
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