import type { LoggableEvent } from "../types";
import { analyticsEvents$, publishEvent } from "./eventLog";

const events: LoggableEvent[] = [];
analyticsEvents$.subscribe(event => events.push(event));

beforeEach(() => {
  events.length = 0;
});

describe("publishEvent", () => {
  it("stamps a date on the published event", () => {
    publishEvent({
      eventName: "Stamped",
      deliveryStatus: "enqueued",
    });

    expect(events[0].date).toBeInstanceOf(Date);
  });

  it("defaults absent payloads to empty objects", () => {
    publishEvent({
      eventName: "Defaults",
      deliveryStatus: "failed_filter",
    });

    expect(events[0]).toEqual({
      date: expect.any(Date),
      eventName: "Defaults",
      eventProps: {},
      eventPropsWithoutExtra: {},
      deliveryStatus: "failed_filter",
    });
  });

  it("forwards the delivery status", () => {
    publishEvent({
      eventName: "Status",
      eventProps: { foo: "bar" },
      eventPropsWithoutExtra: { foo: "bar" },
      deliveryStatus: "failed_enrichment",
    });

    expect(events[0].deliveryStatus).toBe("failed_enrichment");
  });
});
