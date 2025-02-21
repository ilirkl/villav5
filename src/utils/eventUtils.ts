// eventUtils.ts
import { Booking, CalendarEvent } from "../types/calendarTypes";

export const generateGridEvents = (bookings: Booking[]): CalendarEvent[] => {
  const events = bookings.map((booking) => ({
    id: booking.id.toString(),
    title: booking.guest_name,
    start: booking.start_date,
    end: new Date(new Date(booking.end_date).getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    backgroundColor: "#10B981",
    borderColor: "#10B981",
    classNames: ["booking-event"],
    allDay: true,
    extendedProps: { ...booking },
  }));
  return events;
};

export const generateListEvents = (booking: Booking): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  let currentDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);

  while (currentDate <= endDate) {
    const start = currentDate.toISOString().split("T")[0];
    const end = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    let title: string;

    if (start === booking.start_date) {
      title = `Check-In: ${booking.guest_name}`;
    } else if (start === booking.end_date) {
      title = `Check-Out: ${booking.guest_name}`;
    } else {
      title = `Ongoing: ${booking.guest_name}`;
    }

    events.push({
      id: `${booking.id}_${start}`,
      title,
      start,
      end,
      backgroundColor: "#10B981",
      borderColor: "#10B981",
      classNames: ["booking-event"],
      allDay: true,
      extendedProps: { ...booking },
    });
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }
  return events;
};