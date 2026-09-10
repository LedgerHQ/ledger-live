import {
  setAnalytics,
  setExtraPropertiesFunction,
  setMandatoryExtraPropertiesFunction,
  setPropertyFilter,
} from "../registry";
import { trackSubject } from "../trackSubject";
import type { AnalyticsTransport, DeliveryStatus, LoggableEvent, Props } from "../types";
import { trackEvent } from "./trackEvent";

const events: LoggableEvent[] = [];
trackSubject.subscribe(event => events.push(event));

const createTransport = ({
  track = jest.fn(),
  log = jest.fn(),
}: Partial<AnalyticsTransport> = {}): jest.Mocked<AnalyticsTransport> =>
  ({
    track: jest.fn(track),
    log: jest.fn(log),
  }) as unknown as jest.Mocked<AnalyticsTransport>;

const scrubSensitive = (properties: Props): Props => {
  const filtered = { ...properties };
  delete filtered.sensitive;
  return filtered;
};

beforeEach(() => {
  events.length = 0;
  setAnalytics({ track: jest.fn() });
  setExtraPropertiesFunction(undefined);
  setMandatoryExtraPropertiesFunction(undefined);
  setPropertyFilter(undefined);
});

describe("trackEvent", () => {
  describe("enrichment", () => {
    it("sends synchronously for sync extras", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropertiesFunction(() => ({ appVersion: "1.2.3" }));

      const result = trackEvent("track", "Sync Event", {}, false);

      expect(result).toBeUndefined();
      expect(transport.track).toHaveBeenCalledWith("Sync Event", {
        appVersion: "1.2.3",
      });
    });

    it("resolves after sending for async extras", async () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropertiesFunction(async () => ({ appVersion: "1.2.3" }));

      const result = trackEvent("track", "Async Event", {}, false);

      expect(result).toBeInstanceOf(Promise);
      expect(transport.track).not.toHaveBeenCalled();
      await result;
      expect(transport.track).toHaveBeenCalledWith("Async Event", {
        appVersion: "1.2.3",
      });
    });

    it("calls the extra properties function with no arguments", () => {
      const transport = createTransport();
      setAnalytics(transport);
      const extraProperties = jest.fn(() => ({}));
      setExtraPropertiesFunction(extraProperties);

      trackEvent("track", "Stateful", {}, false);

      expect(extraProperties).toHaveBeenCalledWith();
    });

    it("lets extra properties win over caller properties", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropertiesFunction(() => ({ platform: "desktop" }));

      trackEvent("track", "Collision", { platform: "caller-supplied" }, false);

      expect(transport.track).toHaveBeenCalledWith("Collision", {
        platform: "desktop",
      });
    });

    it("uses mandatory extra properties for mandatory events", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setMandatoryExtraPropertiesFunction(() => ({ mandatory: "props" }));

      trackEvent("track", "Mandatory Event", { flow: "onboarding" }, true);

      expect(transport.track).toHaveBeenCalledWith("Mandatory Event", {
        flow: "onboarding",
        mandatory: "props",
      });
    });

    it("reports failed_enrichment without rejecting when async extras reject", async () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropertiesFunction(() => Promise.reject(new Error("permission read failed")));

      await expect(
        trackEvent("track", "Unenrichable", { foo: "bar" }, false),
      ).resolves.toBeUndefined();

      expect(transport.track).not.toHaveBeenCalled();
      expect(events).toEqual([
        expect.objectContaining({
          eventName: "Unenrichable",
          eventProperties: { foo: "bar" },
          eventPropertiesWithoutExtra: { foo: "bar" },
          deliveryStatus: "failed_enrichment",
        }),
      ]);
    });

    it("reports failed_enrichment when sync extras throw", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropertiesFunction(() => {
        throw new Error("permission read failed");
      });

      trackEvent("track", "Unenrichable", { foo: "bar" }, false);

      expect(transport.track).not.toHaveBeenCalled();
      expect(events).toEqual([
        expect.objectContaining({
          eventName: "Unenrichable",
          eventProperties: { foo: "bar" },
          eventPropertiesWithoutExtra: { foo: "bar" },
          deliveryStatus: "failed_enrichment",
        }),
      ]);
    });
  });

  describe("property filter", () => {
    it("filters caller properties before sending", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setPropertyFilter(scrubSensitive);

      trackEvent("track", "Tracking Event", { sensitive: "data to filter", theme: "light" }, false);

      expect(transport.track).toHaveBeenCalledWith("Tracking Event", {
        theme: "light",
      });
    });

    it("filters enriched properties before sending", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropertiesFunction(() => ({ sensitive: "from-enricher", appVersion: "1.2.3" }));
      setPropertyFilter(scrubSensitive);

      trackEvent("track", "Enriched Event", { theme: "light" }, false);

      expect(transport.track).toHaveBeenCalledWith("Enriched Event", {
        theme: "light",
        appVersion: "1.2.3",
      });
    });

    it("publishes filtered payloads to trackSubject on success", () => {
      setAnalytics(createTransport());
      setExtraPropertiesFunction(() => ({ sensitive: "from-enricher", appVersion: "1.2.3" }));
      setPropertyFilter(scrubSensitive);

      trackEvent("track", "Subject Event", { theme: "light" }, false);

      expect(events[0]).toEqual(
        expect.objectContaining({
          eventName: "Subject Event",
          eventProperties: { theme: "light", appVersion: "1.2.3" },
          eventPropertiesWithoutExtra: { theme: "light" },
        }),
      );
    });

    it("publishes filtered payloads to trackSubject when async extras reject", async () => {
      setAnalytics(createTransport());
      setExtraPropertiesFunction(() => Promise.reject(new Error("permission read failed")));
      setPropertyFilter(scrubSensitive);

      await trackEvent(
        "track",
        "Unenrichable",
        { sensitive: "data to filter", theme: "light" },
        false,
      );

      expect(events).toEqual([
        expect.objectContaining({
          eventName: "Unenrichable",
          eventProperties: { theme: "light" },
          eventPropertiesWithoutExtra: { theme: "light" },
          deliveryStatus: "failed_enrichment",
        }),
      ]);
    });

    it("reports failed_filter when the property filter throws", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setPropertyFilter(() => {
        throw new Error("filter failed");
      });

      trackEvent("track", "Filtered Event", { theme: "light" }, false);

      expect(transport.track).not.toHaveBeenCalled();
      expect(events).toEqual([
        expect.objectContaining({
          eventName: "Filtered Event",
          deliveryStatus: "failed_filter",
        }),
      ]);
    });
  });

  describe("delivery status", () => {
    it("defaults to enqueued for a synchronous transport", () => {
      setAnalytics(createTransport());

      trackEvent("track", "Enqueued", {}, false);

      expect(events[0].deliveryStatus).toBe("enqueued");
    });

    it("lets the transport override the default status", async () => {
      setAnalytics(
        createTransport({
          track: async () => "skipped_no_token" as DeliveryStatus,
        }),
      );

      await trackEvent("track", "Overridden", {}, false);

      expect(events[0].deliveryStatus).toBe("skipped_no_token");
    });

    it("defaults to enqueued for a transport resolving nothing", async () => {
      setAnalytics(createTransport({ track: async () => {} }));

      await trackEvent("track", "Async Void", {}, false);

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

      expect(() => trackEvent("track", "Throwing", {}, false)).not.toThrow();
      expect(events[0].deliveryStatus).toBe("failed_tracking");
    });

    it("reports failed_tracking without rejecting when the transport rejects", async () => {
      setAnalytics(
        createTransport({
          track: async () => Promise.reject(new Error("segment is down")),
        }),
      );

      await expect(trackEvent("track", "Rejecting", {}, false)).resolves.toBeUndefined();
      expect(events[0].deliveryStatus).toBe("failed_tracking");
    });

    it("reports skipped_no_client when no transport is registered", () => {
      setAnalytics(undefined as unknown as AnalyticsTransport);

      trackEvent("track", "No Client", {}, false);

      expect(events[0].deliveryStatus).toBe("skipped_no_client");
    });

    it("publishes enriched and caller-only payloads separately", () => {
      setAnalytics(createTransport());
      setExtraPropertiesFunction(() => ({ appVersion: "1.2.3" }));

      trackEvent("track", "Both Payloads", { foo: "bar" }, false);

      expect(events[0]).toEqual({
        date: expect.any(Date),
        deliveryStatus: "enqueued",
        eventName: "Both Payloads",
        eventProperties: { foo: "bar", appVersion: "1.2.3" },
        eventPropertiesWithoutExtra: { foo: "bar" },
      });
    });
  });

  describe("logging", () => {
    it("logs before sending", () => {
      const transport = createTransport();
      setAnalytics(transport);

      trackEvent("track", "Logged", { foo: "bar" }, false);

      expect(transport.log).toHaveBeenCalledWith("track", "Logged", {
        foo: "bar",
      });
      expect(transport.track).toHaveBeenCalledWith("Logged", { foo: "bar" });
    });
  });
});
