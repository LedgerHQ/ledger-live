import React from "react";
import { TrackScreen } from "@shared/analytics-react";
import type { PayTrackPageProps } from "./PayTrackPage.types";

export function PayTrackPage({ page, name, ...properties }: PayTrackPageProps) {
  return <TrackScreen category={page} name={name} {...properties} />;
}
