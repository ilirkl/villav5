// EventContent.tsx
import React from "react";
import { EventContentArg } from "@fullcalendar/core";

interface EventContentProps {
  eventInfo: EventContentArg;
}

export const EventContent: React.FC<EventContentProps> = ({ eventInfo }) => {
  console.log("Rendering event:", {
    title: eventInfo.event.title,
    view: eventInfo.view.type,
    start: eventInfo.event.start,
    end: eventInfo.event.end,
    allDay: eventInfo.event.allDay,
  });

  return (
    <div className="fc-event-content">
      {eventInfo.event.title}
    </div>
  );
};