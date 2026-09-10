import { setAnalytics } from "../registry";
import type { Analytics, DeliveryStatus, LoggableEvent } from "../types";
import { deliver } from "./deliver";
import { analyticsEvents$ } from "./eventLog";

const events: LoggableEvent[] = [];
analyticsEvents$.subscribe(event => events.push(event));

const createAnalyticsClient = ({
  track = jest.fn(),
  log = jest.fn(),
}: Partial<Analytics> = {}): jest.Mocked<Analytics> =>
  ({
    track: jest.fn(track),
    log: jest.fn(log),
  }) as unknown as jest.Mocked<Analytics>;

beforeEach(() => {
  events.length = 0;
  setAnalytics({ track: jest.fn() });
});

describe("deliver", () => {
  it("sends the event name and props to the analytics client", () => {
    const analytics = createAnalyticsClient();
    setAnalytics(analytics);

    deliver({
      type: "track",
      eventName: "Tracked",
      eventProps: { foo: "bar" },
      eventPropsWithoutExtra: { foo: "bar" },
    });

    expect(analytics.track).toHaveBeenCalledWith("Tracked", { foo: "bar" });
  });

  it("logs before sending", () => {
    const analytics = createAnalyticsClient();
    setAnalytics(analytics);

    deliver({
      type: "track",
      eventName: "Logged",
      eventProps: { foo: "bar" },
      eventPropsWithoutExtra: { foo: "bar" },
    });

    expect(analytics.log).toHaveBeenCalledWith("track", "Logged", {
      foo: "bar",
    });
  });

  it("publishes enriched payloads", () => {
    setAnalytics(createAnalyticsClient());

    deliver({
      type: "track",
      eventName: "Both Payloads",
      eventProps: { foo: "bar", appVersion: "1.2.3" },
      eventPropsWithoutExtra: { foo: "bar" },
    });

    expect(events[0]).toEqual({
      date: expect.any(Date),
      deliveryStatus: "enqueued",
      eventName: "Both Payloads",
      eventProps: { foo: "bar", appVersion: "1.2.3" },
      eventPropsWithoutExtra: { foo: "bar" },
    });
  });

  describe("delivery status", () => {
    it("defaults to enqueued for a synchronous analytics client", () => {
      setAnalytics(createAnalyticsClient());

      deliver({
        type: "track",
        eventName: "Enqueued",
        eventProps: {},
        eventPropsWithoutExtra: {},
      });

      expect(events[0].deliveryStatus).toBe("enqueued");
    });

    it("lets the analytics client override the default status", async () => {
      setAnalytics(
        createAnalyticsClient({
          track: async () => "skipped_no_token" as DeliveryStatus,
        }),
      );

      await deliver({
        type: "track",
        eventName: "Overridden",
        eventProps: {},
        eventPropsWithoutExtra: {},
      });

      expect(events[0].deliveryStatus).toBe("skipped_no_token");
    });

    it("defaults to enqueued for an analytics client resolving nothing", async () => {
      setAnalytics(createAnalyticsClient({ track: async () => {} }));

      await deliver({
        type: "track",
        eventName: "Async Void",
        eventProps: {},
        eventPropsWithoutExtra: {},
      });

      expect(events[0].deliveryStatus).toBe("enqueued");
    });

    it("reports failed_tracking when the analytics client throws", () => {
      setAnalytics(
        createAnalyticsClient({
          track: () => {
            throw new Error("segment is down");
          },
        }),
      );

      expect(() =>
        deliver({
          type: "track",
          eventName: "Throwing",
          eventProps: {},
          eventPropsWithoutExtra: {},
        }),
      ).not.toThrow();
      expect(events[0].deliveryStatus).toBe("failed_tracking");
    });

    it("reports failed_tracking without rejecting when the analytics client rejects", async () => {
      setAnalytics(
        createAnalyticsClient({
          track: async () => Promise.reject(new Error("segment is down")),
        }),
      );

      await expect(
        deliver({
          type: "track",
          eventName: "Rejecting",
          eventProps: {},
          eventPropsWithoutExtra: {},
        }),
      ).resolves.toBeUndefined();
      expect(events[0].deliveryStatus).toBe("failed_tracking");
    });

    it("reports skipped_no_client when no analytics client is registered", () => {
      setAnalytics(undefined as unknown as Analytics);

      deliver({
        type: "track",
        eventName: "No Client",
        eventProps: {},
        eventPropsWithoutExtra: {},
      });

      expect(events[0].deliveryStatus).toBe("skipped_no_client");
    });
  });
});
