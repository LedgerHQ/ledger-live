import React from "react";
import { Track } from "@shared/analytics-react";
import type { SecurityStateEvent } from "../../Security.types";

/** Sends each event again when it changes, as the legacy General screen does. */
export function SecurityStateEvents({
  events,
}: Readonly<{ events: readonly SecurityStateEvent[] }>) {
  return (
    <>
      {events.map(({ id, event }) => (
        <Track key={id} onUpdate event={event} />
      ))}
    </>
  );
}
