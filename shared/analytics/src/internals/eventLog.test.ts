import type { LoggableEvent } from "../types";
import { analyticsEvents$, publishEvent } from "./eventLog";

const events: LoggableEvent[] = [];
let sub: ReturnType<typeof analyticsEvents$.subscribe>;

beforeAll(() => {
  sub = analyticsEvents$.subscribe(event => events.push(event));
});

afterAll(() => {
  sub.unsubscribe();
});

beforeEach(() => {
  events.length = 0;
});

describe("publishEvent", () => {
  it("publishes a dated event to analyticsEvents$", () => {
    publishEvent({
      eventName: "Published",
      eventProperties: { foo: "bar", appVersion: "1.2.3" },
      eventPropertiesWithoutExtra: { foo: "bar" },
      deliveryStatus: "enqueued",
    });

    expect(events[0]).toEqual({
      date: expect.any(Date),
      eventName: "Published",
      eventProperties: { foo: "bar", appVersion: "1.2.3" },
      eventPropertiesWithoutExtra: { foo: "bar" },
      deliveryStatus: "enqueued",
    });
  });

  it("defaults absent payloads to empty objects", () => {
    publishEvent({
      eventName: "Defaults",
      deliveryStatus: "failed_filter",
    });

    expect(events[0]).toEqual({
      date: expect.any(Date),
      eventName: "Defaults",
      eventProperties: {},
      eventPropertiesWithoutExtra: {},
      deliveryStatus: "failed_filter",
    });
  });

  it("forwards the delivery status", () => {
    publishEvent({
      eventName: "Status",
      eventProperties: { foo: "bar" },
      eventPropertiesWithoutExtra: { foo: "bar" },
      deliveryStatus: "failed_enrichment",
    });

    expect(events[0].deliveryStatus).toBe("failed_enrichment");
  });

  it("omits deliveryStatus when the caller does not provide one", () => {
    publishEvent({
      eventName: "[Identify]",
      eventProperties: { userIdPresent: true },
      eventPropertiesWithoutExtra: { userIdPresent: true },
    });

    expect(events[0]).toEqual({
      date: expect.any(Date),
      eventName: "[Identify]",
      eventProperties: { userIdPresent: true },
      eventPropertiesWithoutExtra: { userIdPresent: true },
    });
    expect("deliveryStatus" in events[0]).toBe(false);
  });
});
