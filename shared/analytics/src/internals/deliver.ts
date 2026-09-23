import { getAnalytics } from "../registry";
import type { DeliveryStatus, EventType, Props } from "../types";
import { publishEvent } from "./eventLog";
import { isThenable } from "./isThenable";

type Delivery = {
  type: EventType;
  eventName: string;
  eventProperties: Props;
  eventPropertiesWithoutExtra: Props;
};

export async function deliver({
  type: kind,
  eventName,
  eventProperties,
  eventPropertiesWithoutExtra,
}: Delivery): Promise<void> {
  const publish = (deliveryStatus: DeliveryStatus) =>
    publishEvent({
      eventName,
      eventProperties,
      eventPropertiesWithoutExtra,
      deliveryStatus,
    });

  const analytics = getAnalytics();
  if (!analytics) {
    publish("skipped_no_client");
    return;
  }

  try {
    analytics.log?.(kind, eventName, eventProperties);
  } catch {}

  try {
    const status = analytics.track(eventName, eventProperties);
    if (isThenable(status)) {
      const resolved = await status;
      publish(resolved ?? "enqueued");
      return;
    }
    publish(status ?? "enqueued");
  } catch {
    publish("failed_tracking");
  }
}
