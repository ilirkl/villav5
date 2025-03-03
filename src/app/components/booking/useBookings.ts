"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { Booking } from './Booking';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 10;
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchBookings = useCallback(async (reset = false) => {
    if (isFetchingRef.current || !hasMore || isLoading || (Date.now() - lastFetchTimeRef.current < 300)) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    lastFetchTimeRef.current = Date.now();
    const currentOffset = reset ? 0 : offset;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setIsLoading(false);
      isFetchingRef.current = false;
      return;
    }

    const userId = session.user.id;

    try {
      let query = supabase
        .from('bookings')
        .select('id, start_date, end_date, checkin_time, checkout_time, guest_name, guest_phone, amount, prepayment, notes, user_id', { count: 'exact' })
        .eq('user_id', userId)
        .range(currentOffset, currentOffset + limit - 1);

      if (startDate) query = query.gte('start_date', startDate);
      if (endDate) query = query.lte('end_date', endDate);

      query = query.order(sortBy === 'date' ? 'start_date' : sortBy, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await query;
      if (error) throw error;

      const fetchedBookings = data as Booking[];

      setBookings((prev) => {
        if (reset) {
          return fetchedBookings;
        }
        const newBookings = fetchedBookings.filter(
          (newBooking) => !prev.some((existing) => existing.id === newBooking.id)
        );
        return [...prev, ...newBookings];
      });

      if (!reset && fetchedBookings.length > 0) {
        setOffset((prev) => prev + limit);
      }
      setHasMore(count ? currentOffset + fetchedBookings.length < count : fetchedBookings.length === limit);
    } catch  {
      setBookings([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [offset, hasMore, isLoading, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    fetchBookings(true);
  }, [startDate, endDate, sortBy, sortOrder, fetchBookings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const scrollTop = document.documentElement.scrollTop;
      const offsetHeight = document.documentElement.offsetHeight;

      if (
        windowHeight + scrollTop >= offsetHeight - 100 &&
        hasMore &&
        !isLoading
      ) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => fetchBookings(false), 300);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [fetchBookings, hasMore, isLoading]);

  const handleSort = (newSortBy: 'date' | 'name' | 'amount') => {
    setSortBy(newSortBy);
    setSortOrder(sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return {
    bookings,
    setBookings,
    isLoading,
    hasMore,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortBy,
    sortOrder,
    fetchBookings,
    handleSort,
  };
};