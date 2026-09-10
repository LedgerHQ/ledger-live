import { getAnalytics } from "../registry";
import type { DeliveryStatus, EventType, Props } from "../types";
import { publishEvent } from "./eventLog";

type Delivery = {
  type: EventType;
  eventName: string;
  eventProps: Props;
  eventPropsWithoutExtra: Props;
};

export async function deliver({
  type: kind,
  eventName,
  eventProps,
  eventPropsWithoutExtra,
}: Delivery): Promise<void> {
  const publish = (deliveryStatus: DeliveryStatus) =>
    publishEvent({
      eventName,
      eventProps,
      eventPropsWithoutExtra,
      deliveryStatus,
    });

  const analytics = getAnalytics();
  if (!analytics) {
    publish("skipped_no_client");
    return;
  }

  try {
    analytics.log?.(kind, eventName, eventProps);
  } catch {}

  try {
    const status = await analytics.track(eventName, eventProps);
    publish(status ?? "enqueued");
  } catch {
    publish("failed_tracking");
  }
}
