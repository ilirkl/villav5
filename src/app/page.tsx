"use client";

import React, { useState, useCallback } from "react";
import { Calendar } from "../app/components/calendar/Calendar";
import Modal from "../app/components/Modal";
import BookingDetails from "../app/components/booking/BookingDetails";
import { useAuthAndFetch } from "../hooks/useAuthAndFetch";
import { generateGridEvents, generateListEvents } from "../utils/eventUtils";
import { Booking, CalendarEvent } from "../types/calendarTypes";
import type { ViewMountArg, EventClickArg } from "@fullcalendar/core";

export default function Home() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState("dayGridMonth"); // Track view explicitly

  const handleBookingsFetched = useCallback((data: Booking[]) => {
    setBookings(data);
    setCalendarEvents(generateGridEvents(data));
  }, []);

  const { isLoading } = useAuthAndFetch(handleBookingsFetched);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const booking = clickInfo.event.extendedProps as Booking;
    setSelectedBooking(booking);
    setIsModalOpen(true);
  }, []);

  const handleViewChange = useCallback((viewInfo: ViewMountArg) => {
    const newView = viewInfo.view.type;
    if (newView !== currentView) { // Only update if view actually changes
      setCurrentView(newView);
      if (newView === "listWeek") {
        const listEvents = bookings.map((booking) => generateListEvents(booking)).flat();
        setCalendarEvents(listEvents);
        console.log("Updated listWeek events:", listEvents); // Keep for debugging
      } else {
        const gridEvents = generateGridEvents(bookings);
        setCalendarEvents(gridEvents);
        console.log("Updated grid events:", gridEvents); // Keep for debugging
      }
    }
  }, [bookings, currentView]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="calendar-container">
        <Calendar
          events={calendarEvents}
          onEventClick={handleEventClick}
          onViewChange={handleViewChange}
        />
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBooking(null);
        }}
        title="Detaje"
      >
        {selectedBooking && <BookingDetails booking={selectedBooking} />}
      </Modal>
    </div>
  );
}