import { getAnalytics } from "../registry";
import type { DeliveryStatus, EventType, Props } from "../types";
import { isThenable } from "./isThenable";
import { publishEvent } from "./eventLog";

type Delivery = {
  type: EventType;
  eventName: string;
  eventProps: Props;
  eventPropsWithoutExtra: Props;
};

export function deliver({
  type: kind,
  eventName,
  eventProps,
  eventPropsWithoutExtra,
}: Delivery): void | Promise<void> {
  const publish = (deliveryStatus: DeliveryStatus) =>
    publishEvent({
      eventName,
      eventProps,
      eventPropsWithoutExtra,
      deliveryStatus,
    });

  const analytics = getAnalytics();
  if (!analytics) return publish("skipped_no_client");

  try {
    analytics.log?.(kind, eventName, eventProps);
  } catch {}

  let result: void | Promise<void | DeliveryStatus>;

  try {
    result = analytics.track(eventName, eventProps);
  } catch {
    return publish("failed_tracking");
  }

  if (!isThenable<void | DeliveryStatus>(result)) return publish("enqueued");

  return result.then(
    status => publish(status ?? "enqueued"),
    () => publish("failed_tracking"),
  );
}
