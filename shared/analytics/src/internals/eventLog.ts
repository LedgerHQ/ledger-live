import { ReplaySubject } from "rxjs";
import type { DeliveryStatus, LoggableEvent, Props } from "../types";

const eventLog = new ReplaySubject<LoggableEvent>(30);

export const analyticsEvents$ = eventLog.asObservable();

export function publishEvent({
  eventName,
  eventProps = {},
  eventPropsWithoutExtra = {},
  deliveryStatus,
}: {
  eventName: string;
  eventProps?: Props;
  eventPropsWithoutExtra?: Props;
  deliveryStatus: DeliveryStatus;
}): void {
  eventLog.next({
    eventName,
    eventProps,
    eventPropsWithoutExtra,
    date: new Date(),
    deliveryStatus,
  });
}
