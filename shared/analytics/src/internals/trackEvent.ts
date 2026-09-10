import { applyPropsFilter, resolveExtraProps } from "../registry";
import type { EventType, Props } from "../types";
import { deliver } from "./deliver";
import { isThenable } from "./isThenable";
import { publishEvent } from "./publishEvent";

export function trackEvent(
  kind: EventType,
  eventName: string,
  props: Props,
  mandatory: boolean,
): void | Promise<void> {
  let callerProps: Props;

  try {
    callerProps = applyPropsFilter(props);
  } catch {
    publishEvent({ eventName, deliveryStatus: "failed_filter" });
    return;
  }

  const send = (extras: Props | undefined) =>
    deliver({
      type: kind,
      eventName,
      eventProps: applyPropsFilter({ ...props, ...extras }),
      eventPropsWithoutExtra: callerProps,
    });

  const failEnrichment = () =>
    publishEvent({
      eventName,
      eventProps: callerProps,
      eventPropsWithoutExtra: callerProps,
      deliveryStatus: "failed_enrichment",
    });

  let extras: Props | Promise<Props> | undefined;
  try {
    extras = resolveExtraProps(mandatory);
  } catch {
    return failEnrichment();
  }

  if (!isThenable<Props>(extras)) return send(extras);

  return extras.then(send, failEnrichment);
}
