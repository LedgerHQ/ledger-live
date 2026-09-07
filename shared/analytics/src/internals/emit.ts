import { getAnalytics } from "../registry";
import { trackSubject } from "../trackSubject";
import type { DeliveryStatus, LoggableEventProperties, Props } from "../types";

export const isThenable = <T>(value: unknown): value is Promise<T> =>
  typeof (value as Promise<T> | null | undefined)?.then === "function";

type EmitInput = {
  kind: "track" | "page";
  eventName: string;
  eventProperties: Props;
  eventPropertiesWithoutExtra: LoggableEventProperties;
};

export function emit({
  kind,
  eventName,
  eventProperties,
  eventPropertiesWithoutExtra,
}: EmitInput): void | Promise<void> {
  const publish = (deliveryStatus: DeliveryStatus) => {
    trackSubject.next({
      eventName,
      eventProperties,
      eventPropertiesWithoutExtra,
      date: new Date(),
      deliveryStatus,
    });
  };

  const transport = getAnalytics();
  if (!transport) {
    publish("skipped_no_client");
    return;
  }

  transport.log?.(kind, eventName, eventProperties);

  let result: void | Promise<void | DeliveryStatus>;
  try {
    result = transport.track(eventName, eventProperties);
  } catch {
    publish("failed");
    return;
  }

  if (!isThenable<void | DeliveryStatus>(result)) {
    publish("enqueued");
    return;
  }

  return result.then(
    status => publish(status ?? "enqueued"),
    () => publish("failed"),
  );
}
