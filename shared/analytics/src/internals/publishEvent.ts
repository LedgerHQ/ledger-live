import { trackSubject } from "../trackSubject";
import type { DeliveryStatus, Props } from "../types";

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
  trackSubject.next({
    eventName,
    eventProps,
    eventPropsWithoutExtra,
    date: new Date(),
    deliveryStatus,
  });
}
