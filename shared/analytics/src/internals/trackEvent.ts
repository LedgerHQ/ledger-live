import { applyPropsFilter, resolveExtraProps } from "../registry";
import type { EventType, Props } from "../types";
import { deliver } from "./deliver";

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
    return deliver({
      type: kind,
      eventName,
      eventProperties: {},
      eventPropertiesWithoutExtra: {},
      failure: "failed_filter",
    });
  }

  let extraProps: Props;

  try {
    extraProps = (await resolveExtraProps(mandatory)) ?? {};
  } catch {
    return deliver({
      type: kind,
      eventName,
      eventProperties: filteredProps,
      eventPropertiesWithoutExtra: filteredProps,
      failure: "failed_enrichment",
    });
  }

  let filteredExtras: Props;

  try {
    filteredExtras = applyPropsFilter({ ...props, ...extraProps });
  } catch {
    return deliver({
      type: kind,
      eventName,
      eventProperties: {},
      eventPropertiesWithoutExtra: {},
      failure: "failed_filter",
    });
  }

  await deliver({
    type: kind,
    eventName,
    eventProperties: filteredExtras,
    eventPropertiesWithoutExtra: filteredProps,
  });
}
