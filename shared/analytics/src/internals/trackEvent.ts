import { applyPropsFilter, resolveExtraProps } from "../registry";
import type { EventType, Props } from "../types";
import { deliver } from "./deliver";
import { publishEvent } from "./eventLog";

type TrackEvent = {
  kind: EventType;
  eventName: string;
  props: Props;
  mandatory?: boolean;
  callerWins?: readonly string[];
};

function mergeWithExtras(props: Props, extraProps: Props, callerWins?: readonly string[]): Props {
  const merged: Props = { ...props, ...extraProps };
  if (!callerWins) return merged;

  for (const key of callerWins) {
    if (props[key] !== undefined) merged[key] = props[key];
    else delete merged[key];
  }
  return merged;
}

export async function trackEvent({
  kind,
  eventName,
  props,
  mandatory = false,
  callerWins,
}: TrackEvent) {
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
      eventProperties: filteredProps,
      eventPropertiesWithoutExtra: filteredProps,
      deliveryStatus: "failed_enrichment",
    });
    return;
  }

  let filteredExtras: Props;

  try {
    filteredExtras = applyPropsFilter(mergeWithExtras(props, extraProps, callerWins));
  } catch {
    publishEvent({ eventName, deliveryStatus: "failed_filter" });
    return;
  }

  await deliver({
    type: kind,
    eventName,
    eventProperties: filteredExtras,
    eventPropertiesWithoutExtra: filteredProps,
  });
}
