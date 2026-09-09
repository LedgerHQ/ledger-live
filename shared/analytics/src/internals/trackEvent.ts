import { applyPropsFilter, resolveExtraProps } from "../registry";
import type { EventType, Props, TrackOptions } from "../types";
import { deliver } from "./deliver";
import { publishEvent } from "./eventLog";

export async function trackEvent(
  kind: EventType,
  eventName: string,
  props: Props,
  { mandatory = false }: TrackOptions = {},
) {
  let filteredProps: Props;

  try {
    filteredProps = applyPropsFilter(props);
  } catch {
    publishEvent({ eventName, deliveryStatus: "failed_filter" });
    return;
  }

  let filteredExtras: Props = {};

  try {
    filteredExtras = applyPropsFilter({ ...props, ...(await resolveExtraProps(mandatory)) });
  } catch {
    publishEvent({
      eventName,
      eventProps: filteredProps,
      eventPropsWithoutExtra: filteredProps,
      deliveryStatus: "failed_enrichment",
    });
    return;
  }

  await deliver({
    type: kind,
    eventName,
    eventProps: filteredExtras,
    eventPropsWithoutExtra: filteredProps,
  });
}
