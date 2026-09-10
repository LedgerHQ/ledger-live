import { isThenable } from "./isThenable";
import { applyPropsFilter, getAnalytics, resolveExtraProps } from "../registry";
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
    filteredProps = applyPropsFilter(props);
  } catch {
    handleFail({ eventName, deliveryStatus: "failed_filter" });
    return;
  }

  const dispatch = (extras: Props | undefined) => {
    const eventProps = applyPropsFilter({ ...props, ...extras });

    return emit({
      kind,
      eventName,
      eventProps,
      eventPropsWithoutExtra: filteredProps,
    });
  };

  let extras: Props | Promise<Props> | undefined;
  try {
    extras = resolveExtraProps(mandatory);
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
  eventProps: Props;
  eventPropsWithoutExtra: Props;
};

function emit({ kind, eventName, eventProps, eventPropsWithoutExtra }: Emit): void | Promise<void> {
  const publish = (deliveryStatus: DeliveryStatus) => {
    trackSubject.next({
      eventName,
      eventProps,
      eventPropsWithoutExtra,
      date: new Date(),
      deliveryStatus,
    });
  };

  const transport = getAnalytics();

  if (!transport) {
    publish("skipped_no_client");
    return;
  }

  transport.log?.(kind, eventName, eventProps);

  let result: void | Promise<void | DeliveryStatus>;

  try {
    result = transport.track(eventName, eventProps);
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
    eventProps: enrichedProps,
    eventPropsWithoutExtra: props,
    date: new Date(),
    deliveryStatus,
  });
}
