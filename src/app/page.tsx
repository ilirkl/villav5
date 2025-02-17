"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventContentArg } from '@fullcalendar/common';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from './supabaseClient';
import Modal from './components/Modal';
import BookingDetails from './components/BookingDetails';

interface Booking {
    id: number;
    start_date: string;
    end_date: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    amount: number;
    prepayment: number;
    notes: string;
}


export default function Home() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Check authentication status
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            fetchBookings();
        };
        
        checkAuth();
    }, [router]);

    const fetchBookings = async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('start_date', { ascending: true });

            if (error) {
                throw error;
            }

            if (data) {
                console.log('Fetched bookings:', data);
                setBookings(data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calendarEvents = bookings.map(booking => ({
        id: booking.id.toString(),
        title: booking.guest_name,
        start: booking.start_date,
        end: new Date(new Date(booking.end_date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Add one day to end date
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        classNames: ['booking-event'],
        extendedProps: {
            ...booking
        }
    }));

    const renderEventContent = (eventInfo: EventContentArg) => {
        const booking = eventInfo.event.extendedProps;
        return (
            <div className="booking-event-content">
                <div className="guest-name">
                    {booking.guest_name}
                </div>
                </div>
        );
    };

    const handleEventClick = (clickInfo: { event: { extendedProps: unknown } }) => {
        const booking = clickInfo.event.extendedProps as Booking;
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

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
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={calendarEvents}
                    eventContent={renderEventContent}
                    eventClick={handleEventClick}
                    headerToolbar={{
                        start: 'title',
                        center: '',
                        end: 'prev,next today dayGridMonth,dayGridWeek'
                    }}
                    height="auto"
                    dayMaxEvents={3}
                    displayEventEnd={true}
                    eventDisplay="block"
                    eventOverlap={true}
                    nextDayThreshold="00:00:00"
                    firstDay={1}
                    views={{
                        dayGridMonth: {
                            titleFormat: { year: 'numeric', month: 'short' },
                            fixedWeekCount: false,
                        },
                        dayGridWeek: {
                            titleFormat: { year: 'numeric', month: 'short', day: 'numeric' }
                        }
                    }}
                />
            </div>

            {/* Booking Details Modal */}
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
