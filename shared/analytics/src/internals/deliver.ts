import { getAnalytics } from "../registry";
import type { DeliveryStatus, EventType, Props } from "../types";
import { publishAnalyticsEvent } from "./eventLog";

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
    publishAnalyticsEvent({
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
    const status = await analytics.track(eventName, eventProperties);
    publish(status ?? "enqueued");
  } catch {
    publish("failed_tracking");
  }
}
