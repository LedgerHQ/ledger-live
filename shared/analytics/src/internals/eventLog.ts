import { ReplaySubject } from "rxjs";
import type { AnalyticsEvent, LoggableEvent } from "../types";

const eventLog = new ReplaySubject<LoggableEvent>(30);

export const analyticsEvents$ = eventLog.asObservable();

export function publishEvent({
  eventName,
  eventProperties = {},
  eventPropertiesWithoutExtra = {},
  deliveryStatus,
}: AnalyticsEvent): void {
  eventLog.next({
    eventName,
    eventProperties,
    eventPropertiesWithoutExtra,
    date: new Date(),
    ...(deliveryStatus !== undefined ? { deliveryStatus } : {}),
  });
}
