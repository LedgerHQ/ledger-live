import type { ReactNode } from "react";
import { usePayAnalyticsContext } from "./context";
import type { PayPageProperties } from "./types";

type PayTrackPageProps = PayPageProperties &
  Readonly<{
    page: string;
  }>;

export function PayTrackPage({ page, ...properties }: PayTrackPageProps): ReactNode {
  return usePayAnalyticsContext().renderPage?.(page, properties) ?? null;
}
