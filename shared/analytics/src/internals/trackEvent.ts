import { isThenable } from "./isThenable";
import { applyPropertyFilter, getAnalytics, resolveExtraProperties } from "../registry";
import { trackSubject } from "../trackSubject";
import type { DeliveryStatus, Props } from "../types";

export function trackEvent(
  kind: "track" | "page",
  eventName: string,
  props: Props,
  mandatory: boolean,
): void | Promise<void> {
  let filteredProps: Props;

  try {
    filteredProps = applyPropertyFilter(props);
  } catch {
    handleFail({ eventName, deliveryStatus: "failed_filter" });
    return;
  }

  const dispatch = (extras: Props | undefined) => {
    const eventProperties = applyPropertyFilter({ ...props, ...extras });

    return emit({
      kind,
      eventName,
      eventProperties,
      eventPropertiesWithoutExtra: filteredProps,
    });
  };

  let extras: Props | Promise<Props> | undefined;
  try {
    extras = resolveExtraProperties(mandatory);
  } catch {
    handleFail({
      eventName,
      props: filteredProps,
      enrichedProps: filteredProps,
      deliveryStatus: "failed_enrichment",
    });
    return;
  }

  if (!isThenable<Props>(extras)) return dispatch(extras);

  return extras.then(dispatch, () =>
    handleFail({
      eventName,
      props: filteredProps,
      enrichedProps: filteredProps,
      deliveryStatus: "failed_enrichment",
    }),
  );
}

type Emit = {
  kind: "track" | "page";
  eventName: string;
  eventProperties: Props;
  eventPropertiesWithoutExtra: Props;
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
    publish("failed_tracking");
    return;
  }

  if (!isThenable<void | DeliveryStatus>(result)) {
    publish("enqueued");
    return;
  }

  return result.then(
    status => publish(status ?? "enqueued"),
    () => publish("failed_tracking"),
  );
}

function handleFail({
  eventName,
  enrichedProps = {},
  props = {},
  deliveryStatus,
}: {
  eventName: string;
  enrichedProps?: Props;
  props?: Props;
  deliveryStatus: DeliveryStatus;
}) {
  trackSubject.next({
    eventName,
    eventProperties: enrichedProps,
    eventPropertiesWithoutExtra: props,
    date: new Date(),
    deliveryStatus,
  });
}
