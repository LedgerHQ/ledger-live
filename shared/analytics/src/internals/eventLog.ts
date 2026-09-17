import { ReplaySubject } from "rxjs";
import type { DeliveryStatus, LoggableEvent, Props } from "../types";

const eventLog = new ReplaySubject<LoggableEvent>(30);

export const analyticsEvents$ = eventLog.asObservable();

/**
 * @deprecated Intended only to support unmigrated `updateIdentify` behavior. Prefer events published by the analytics pipeline.
 */
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
