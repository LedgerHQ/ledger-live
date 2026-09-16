import { applyPropsFilter, resolveExtraProps } from "../registry";
import type { EventType, Props } from "../types";
import { deliver } from "./deliver";
import { publishAnalyticsEvent } from "./eventLog";

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
    publishAnalyticsEvent({ eventName, deliveryStatus: "failed_filter" });
    return;
  }

  let extraProps: Props;

  try {
    extraProps = (await resolveExtraProps(mandatory)) ?? {};
  } catch {
    publishAnalyticsEvent({
      eventName,
      eventProperties: filteredProps,
      eventPropertiesWithoutExtra: filteredProps,
      deliveryStatus: "failed_enrichment",
    });
    return;
  }

  let filteredExtras: Props;

  try {
    filteredExtras = applyPropsFilter({ ...props, ...extraProps });
  } catch {
    publishAnalyticsEvent({ eventName, deliveryStatus: "failed_filter" });
    return;
  }

  await deliver({
    type: kind,
    eventName,
    eventProperties: filteredExtras,
    eventPropertiesWithoutExtra: filteredProps,
  });
}
