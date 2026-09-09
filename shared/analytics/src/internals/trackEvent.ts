import { applyPropertyFilter, getAnalytics, resolveExtraProperties } from "../registry";
import { trackSubject } from "../trackSubject";
import type { DeliveryStatus, LoggableEventProperties, Props } from "../types";

const isThenable = <T>(value: unknown): value is Promise<T> =>
  typeof (value as Promise<T> | null | undefined)?.then === "function";

export function trackEvent(
  kind: "track" | "page",
  eventName: string,
  base: Props,
  mandatory: boolean,
): void | Promise<void> {
  const filteredBase = applyPropertyFilter(base);

  const dispatch = (extras: Props | undefined) => {
    const filteredExtras = applyPropertyFilter(extras ?? {});

    return emit({
      kind,
      eventName,
      eventProperties: { ...filteredBase, ...filteredExtras },
      eventPropertiesWithoutExtra: filteredBase,
    });
  };

  const extras = resolveExtraProperties(mandatory);

  if (!isThenable<Props>(extras)) return dispatch(extras);

  return extras.then(dispatch, handleFail(eventName, filteredBase));
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
    status => publish(status ?? "enqueued"),
    () => publish("failed"),
  );
}

function handleFail(
  eventName: string,
  filteredBase: Props,
): ((reason: any) => void | PromiseLike<void>) | null | undefined {
  return () => {
    trackSubject.next({
      eventName,
      eventProperties: filteredBase,
      eventPropertiesWithoutExtra: filteredBase,
      date: new Date(),
      deliveryStatus: "failed",
    });
  };
}
