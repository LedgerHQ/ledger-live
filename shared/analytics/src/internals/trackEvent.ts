import { applyPropsFilter, resolveExtraProps } from "../registry";
import type { EventType, Props } from "../types";
import { deliver } from "./deliver";
import { publishEvent } from "./eventLog";

export async function trackEvent(
  kind: EventType,
  eventName: string,
  props: Props,
  mandatory: boolean,
): Promise<void> {
  let callerProps: Props;

  try {
    callerProps = applyPropsFilter(props);
  } catch {
    publishEvent({ eventName, deliveryStatus: "failed_filter" });
    return;
  }

  const failEnrichment = () =>
    publishEvent({
      eventName,
      eventProps: callerProps,
      eventPropsWithoutExtra: callerProps,
      deliveryStatus: "failed_enrichment",
    });

  let extras: Props | undefined;
  try {
    extras = await resolveExtraProps(mandatory);
  } catch {
    failEnrichment();
    return;
  }

  await deliver({
    type: kind,
    eventName,
    eventProps: applyPropsFilter({ ...props, ...extras }),
    eventPropsWithoutExtra: callerProps,
  });
}
