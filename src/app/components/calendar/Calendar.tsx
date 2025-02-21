// Calendar.tsx
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { EventContent } from "./EventContent";
import { TitleFormatArg, CalendarEvent } from "../../../types/calendarTypes";
import type { ViewMountArg, EventClickArg } from "@fullcalendar/core";

// Extend the Window interface to include our custom property
interface CustomWindow extends Window {
  fullCalendarViewType?: string; // Optional, as it may not always be set
}

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick: (clickInfo: EventClickArg) => void;
  onViewChange: (viewInfo: ViewMountArg) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ events, onEventClick, onViewChange }) => {
  const renderDayHeaderContent = (arg: { date: Date }) => {
    const dayNames = ["E Diel", "E Hënë", "E Martë", "E Mërkurë", "E Enjte", "E Premte", "E Shtunë"];
    return dayNames[arg.date.getDay()];
  };

  const customTitleFormat = (arg: TitleFormatArg): string => {
    const monthNames = [
      "Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor",
      "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor",
    ];

    const start = arg.start;
    const end = arg.end;
    const currentView = (window as CustomWindow).fullCalendarViewType || "dayGridMonth"; // Use CustomWindow instead of any

    if (currentView === "dayGridMonth") {
      return `${monthNames[start.month]} ${start.year}`;
    } else if (currentView === "dayGridWeek" || currentView === "listWeek") {
      const startDay = start.day;
      const endDay = end ? end.day : startDay;
      return `${monthNames[start.month]} ${startDay} - ${endDay}, ${start.year}`;
    }
    return "";
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
      initialView="dayGridMonth"
      events={events}
      eventContent={(eventInfo) => <EventContent eventInfo={eventInfo} />}
      eventClick={onEventClick}
      viewDidMount={(viewInfo) => {
        (window as CustomWindow).fullCalendarViewType = viewInfo.view.type; // Use CustomWindow instead of any
        onViewChange(viewInfo);
      }}
      dayHeaderContent={renderDayHeaderContent}
      buttonText={{
        prev: "mbrapa",
        next: "para",
        today: "sot",
        month: "muaj",
        week: "javë",
        day: "ditë",
        list: "listë",
      }}
      weekText="Ja"
      allDayText=""
      moreLinkText="më shumë"
      noEventsText="Nuk ka ngjarje për të shfaqur"
      headerToolbar={{
        start: "title",
        center: "",
        end: "prev,next today dayGridMonth,dayGridWeek,listWeek",
      }}
      height="auto"
      dayMaxEvents={3}
      displayEventEnd={false}
      eventDisplay="block"
      eventOverlap={true}
      nextDayThreshold="00:00:00"
      firstDay={1}
      views={{
        dayGridMonth: {
          titleFormat: customTitleFormat,
          fixedWeekCount: false,
        },
        dayGridWeek: {
          titleFormat: customTitleFormat,
        },
        listWeek: {
          titleFormat: customTitleFormat,
          listDayFormat: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
          listDaySideFormat: false,
          allDaySlot: false,
        },
      }}
    />
  );
};