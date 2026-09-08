import {
  getAnalytics,
  getAnalyticsState,
  resolveExtraProperties,
} from "../registry";
import { trackSubject } from "../trackSubject";
import type { DeliveryStatus, LoggableEventProperties, Props } from "../types";

const isThenable = <T>(value: unknown): value is Promise<T> =>
  typeof (value as Promise<T> | null | undefined)?.then === "function";

export function send(
  kind: "track" | "page",
  eventName: string,
  base: Props,
  mandatory: boolean
): void | Promise<void> {
  const dispatch = (extras: Props | undefined) =>
    emit({
      kind,
      eventName,
      eventProperties: { ...base, ...extras },
      eventPropertiesWithoutExtra: base,
    });

  const state = getAnalyticsState();
  const extras = resolveExtraProperties(state, mandatory);

  if (!isThenable<Props>(extras)) return dispatch(extras);

  return extras.then(dispatch, () => {
    trackSubject.next({
      eventName,
      eventProperties: base,
      eventPropertiesWithoutExtra: base,
      date: new Date(),
      deliveryStatus: "failed",
    });
  });
}

type Emit = {
  kind: "track" | "page";
  eventName: string;
  eventProperties: Props;
  eventPropertiesWithoutExtra: LoggableEventProperties;
};

function emit({
  kind,
  eventName,
  eventProperties,
  eventPropertiesWithoutExtra,
}: Emit): void | Promise<void> {
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
    (status) => publish(status ?? "enqueued"),
    () => publish("failed")
  );
}
