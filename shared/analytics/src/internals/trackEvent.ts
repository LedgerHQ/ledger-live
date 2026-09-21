import { applyPropsFilter, resolveExtraProps } from "../registry";
import type { EventType, Props } from "../types";
import { deliver } from "./deliver";
import { publishEvent } from "./eventLog";

type TrackEvent = {
  kind: EventType;
  eventName: string;
  props: Props;
  mandatory?: boolean;
};

export async function trackEvent({ kind, eventName, props, mandatory = false }: TrackEvent) {
  let filteredProps: Props;

  try {
    filteredProps = applyPropsFilter(props);
  } catch {
    publishEvent({ eventName, deliveryStatus: "failed_filter" });
    return;
  }

  let extraProps: Props;

  try {
    extraProps = (await resolveExtraProps(mandatory)) ?? {};
  } catch {
    publishEvent({
      eventName,
      eventProps: filteredProps,
      eventPropsWithoutExtra: filteredProps,
      deliveryStatus: "failed_enrichment",
    });
    return;
  }

  let filteredExtras: Props;

  try {
    filteredExtras = applyPropsFilter({ ...props, ...extraProps });
  } catch {
    publishEvent({ eventName, deliveryStatus: "failed_filter" });
    return;
  }

  await deliver({
    type: kind,
    eventName,
    eventProps: filteredExtras,
    eventPropsWithoutExtra: filteredProps,
  });
}
