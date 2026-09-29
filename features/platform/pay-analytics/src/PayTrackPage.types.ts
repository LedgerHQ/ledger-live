import type { PayPageProperties } from "./types";

export type PayTrackPageProps = PayPageProperties &
  Readonly<{
    page: string;
    /** Appended to the event name: `Page ${page} ${name}`, and never sent as a property. */
    name?: string;
  }>;
