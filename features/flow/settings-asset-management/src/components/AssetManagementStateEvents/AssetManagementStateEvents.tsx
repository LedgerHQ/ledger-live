import React from "react";
import { Track } from "@shared/analytics-react";
import type { AssetManagementStateEvent } from "../../tracking";

/** Sends each event again when it changes, as the legacy Accounts screen does. */
export function AssetManagementStateEvents({
  events,
}: Readonly<{ events: readonly AssetManagementStateEvent[] }>) {
  return (
    <>
      {events.map(({ id, event, properties }) => (
        <Track key={id} onUpdate event={event} {...properties} />
      ))}
    </>
  );
}
