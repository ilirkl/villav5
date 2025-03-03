import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

interface FilterControlsProps {
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  sortBy: 'date' | 'name' | 'amount';
  sortOrder: 'asc' | 'desc';
  handleSort: (sortBy: 'date' | 'name' | 'amount') => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  sortBy,
  sortOrder,
  handleSort,
}) => (
  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="border border-gray-300 rounded p-2 text-sm focus:ring-[#FF385C] focus:border-[#FF385C]"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="border border-gray-300 rounded p-2 text-sm focus:ring-[#FF385C] focus:border-[#FF385C]"
      />
      <button
        onClick={() => handleSort('date')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          sortBy === 'date' ? 'bg-[#FF385C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Date {sortBy === 'date' && (sortOrder === 'asc' ? <FiArrowUp className="inline ml-1" /> : <FiArrowDown className="inline ml-1" />)}
      </button>
    </div>
  </div>
);