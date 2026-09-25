import React from "react";
import { TrackPage } from "@shared/analytics-react";
import type { PayTrackPageProps } from "./PayTrackPage.types";

export function PayTrackPage({ page, name, ...properties }: PayTrackPageProps) {
  return <TrackPage category={page} name={name} {...properties} />;
}
