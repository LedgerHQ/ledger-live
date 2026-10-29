import { AnalyticsPiiError } from "../errors";
import { getAnalytics } from "../registry";
import type { DeliveryStatus, EventType, Props } from "../types";
import { publishEvent } from "./eventLog";
import { scrubPii } from "./pii/scrubPii";
import { shouldBlockPii } from "./pii/shouldBlockPii";

type Delivery = {
  type: EventType;
  eventName: string;
  eventProperties: Props;
  eventPropertiesWithoutExtra: Props;
  failure?: "failed_filter" | "failed_enrichment";
};

function scrubDelivery(delivery: Delivery) {
  const name = scrubPii(delivery.eventName, "eventName");
  const properties = scrubPii(delivery.eventProperties, "eventProperties");
  const propertiesWithoutExtra = scrubPii(delivery.eventPropertiesWithoutExtra, "eventProperties");
  const findings = [...name.findings, ...properties.findings, ...propertiesWithoutExtra.findings];
  const uniqueFindings = new Map(
    findings.map(finding => [`${finding.path} ${finding.kind}`, finding]),
  );

  return {
    eventName: name.value,
    eventProperties: properties.value,
    eventPropertiesWithoutExtra: propertiesWithoutExtra.value,
    piiFindings: [...uniqueFindings.values()],
  };
}

export async function deliver(delivery: Delivery): Promise<void> {
  const { eventName, eventProperties, eventPropertiesWithoutExtra, piiFindings } =
    scrubDelivery(delivery);

  const publish = (deliveryStatus: DeliveryStatus) =>
    publishEvent({
      eventName,
      eventProperties,
      eventPropertiesWithoutExtra,
      deliveryStatus,
      ...(piiFindings.length > 0 ? { piiFindings } : {}),
    });

  if (piiFindings.length > 0 && shouldBlockPii()) {
    publish("blocked_pii");
    throw new AnalyticsPiiError(eventName, piiFindings);
  }

  if (delivery.failure) {
    publish(delivery.failure);
    return;
  }

  const analytics = getAnalytics();
  if (!analytics) {
    publish("skipped_no_client");
    return;
  }

  try {
    analytics.log?.(delivery.type, eventName, eventProperties);
  } catch {}

  try {
    const status = await analytics.track(eventName, eventProperties);
    publish(status ?? "enqueued");
  } catch {
    publish("failed_tracking");
  }
}
