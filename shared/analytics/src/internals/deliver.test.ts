import { setAnalytics } from "../registry";
import { trackSubject } from "../trackSubject";
import type { Analytics, DeliveryStatus, LoggableEvent } from "../types";
import { deliver } from "./deliver";

const events: LoggableEvent[] = [];
trackSubject.subscribe(event => events.push(event));

const createTransport = ({
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
  describe("delivery status", () => {
    it("defaults to enqueued for a synchronous transport", () => {
      setAnalytics(createTransport());

      deliver({
        type: "track",
        eventName: "Enqueued",
        eventProps: {},
        eventPropsWithoutExtra: {},
      });

      expect(events[0].deliveryStatus).toBe("enqueued");
    });

    it("lets the transport override the default status", async () => {
      setAnalytics(
        createTransport({
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

    it("defaults to enqueued for a transport resolving nothing", async () => {
      setAnalytics(createTransport({ track: async () => {} }));

      await deliver({
        type: "track",
        eventName: "Async Void",
        eventProps: {},
        eventPropsWithoutExtra: {},
      });

      expect(events[0].deliveryStatus).toBe("enqueued");
    });

    it("reports failed_tracking when the transport throws", () => {
      setAnalytics(
        createTransport({
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

    it("reports failed_tracking without rejecting when the transport rejects", async () => {
      setAnalytics(
        createTransport({
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

    it("reports skipped_no_client when no transport is registered", () => {
      setAnalytics(undefined as unknown as Analytics);

      deliver({
        type: "track",
        eventName: "No Client",
        eventProps: {},
        eventPropsWithoutExtra: {},
      });

      expect(events[0].deliveryStatus).toBe("skipped_no_client");
    });

    it("publishes enriched and caller-only payloads separately", () => {
      setAnalytics(createTransport());

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
  });

  describe("logging", () => {
    it("logs before sending", () => {
      const transport = createTransport();
      setAnalytics(transport);

      deliver({
        type: "track",
        eventName: "Logged",
        eventProps: { foo: "bar" },
        eventPropsWithoutExtra: { foo: "bar" },
      });

      expect(transport.log).toHaveBeenCalledWith("track", "Logged", {
        foo: "bar",
      });
      expect(transport.track).toHaveBeenCalledWith("Logged", { foo: "bar" });
    });
  });
});
