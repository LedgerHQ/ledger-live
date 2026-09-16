import { ReplaySubject } from "rxjs";
import type { DeliveryStatus, LoggableEvent, Props } from "../types";

const eventLog = new ReplaySubject<LoggableEvent>(30);

export const analyticsEvents$ = eventLog.asObservable();

export function publishAnalyticsEvent({
  eventName,
  eventProperties = {},
  eventPropertiesWithoutExtra = {},
  deliveryStatus,
}: {
  eventName: string;
  eventProperties?: Props;
  eventPropertiesWithoutExtra?: Props;
  deliveryStatus?: DeliveryStatus;
}): void {
  eventLog.next({
    eventName,
    eventProperties,
    eventPropertiesWithoutExtra,
    date: new Date(),
    ...(deliveryStatus !== undefined ? { deliveryStatus } : {}),
  });
}
