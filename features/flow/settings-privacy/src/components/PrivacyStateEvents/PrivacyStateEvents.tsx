import React from "react";
import { Track } from "@shared/analytics-react";
import type { PrivacyStateEvent } from "../../Privacy.types";

/** Sends each event again when it changes, as the legacy General screens do. */
export function PrivacyStateEvents({ events }: Readonly<{ events: readonly PrivacyStateEvent[] }>) {
  return (
    <>
      {events.map(({ id, event, mandatory }) => (
        <Track key={id} onUpdate event={event} mandatory={mandatory} />
      ))}
    </>
  );
}
