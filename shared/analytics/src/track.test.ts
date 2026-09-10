import {
  setAnalytics,
  setEnabledFunction,
  setExtraPropertiesFunction,
  setMandatoryExtraPropertiesFunction,
  setPropertyFilter,
} from "./registry";
import { track } from "./track";
import { trackSubject } from "./trackSubject";
import type { AnalyticsTransport, LoggableEvent, Props } from "./types";

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

const register = (transport = createTransport()) => {
  setAnalytics(transport);
  setEnabledFunction(() => true);
  return transport;
};

beforeEach(() => {
  events.length = 0;
  setAnalytics({ track: jest.fn() });
  setEnabledFunction(() => true);
  setExtraPropertiesFunction(undefined);
  setMandatoryExtraPropertiesFunction(undefined);
  setPropertyFilter(undefined);
});

describe("track", () => {
  describe("consent", () => {
    it("sends event properties and extra properties when tracking is enabled", () => {
      const transport = register();
      setExtraPropertiesFunction(() => ({ extra: "props" }));

      track("Analytics Event", { event: "props" });

      expect(transport.track).toHaveBeenCalledWith("Analytics Event", {
        event: "props",
        extra: "props",
      });
    });

    it("does not send non-mandatory events when tracking is disabled", () => {
      const transport = register();
      setEnabledFunction(() => false);

      track("Analytics Consent", { flow: "onboarding" });

      expect(transport.track).not.toHaveBeenCalled();
    });

    it("sends mandatory events with mandatory properties when tracking is disabled", () => {
      const transport = register();
      setEnabledFunction(() => false);
      setMandatoryExtraPropertiesFunction(() => ({ mandatory: "props" }));

      track("Analytics Consent", { flow: "onboarding" }, { mandatory: true });

      expect(transport.track).toHaveBeenCalledWith("Analytics Consent", {
        flow: "onboarding",
        mandatory: "props",
      });
    });
  });

  describe("enrichment", () => {
    it("sends synchronously for a sync enricher", () => {
      const transport = register();
      setExtraPropertiesFunction(() => ({ appVersion: "1.2.3" }));

      const result = track("Sync Event");

      expect(result).toBeUndefined();
      expect(transport.track).toHaveBeenCalledWith("Sync Event", {
        appVersion: "1.2.3",
      });
    });

    it("resolves after sending for an async enricher", async () => {
      const transport = register();
      setExtraPropertiesFunction(async () => ({ appVersion: "1.2.3" }));

      const result = track("Async Event");

      expect(result).toBeInstanceOf(Promise);
      expect(transport.track).not.toHaveBeenCalled();
      await result;
      expect(transport.track).toHaveBeenCalledWith("Async Event", {
        appVersion: "1.2.3",
      });
    });
  });

  describe("property filter", () => {
    it("filters properties before sending", () => {
      const transport = register();
      setPropertyFilter((properties: Props) => {
        const filtered = { ...properties };
        delete filtered.sensitive;
        return filtered;
      });

      track("Tracking Event", { sensitive: "data to filter", theme: "light" });

      expect(transport.track).toHaveBeenCalledWith("Tracking Event", {
        theme: "light",
      });
    });
  });

  describe("observability", () => {
    it("logs before sending and publishes to trackSubject", () => {
      const transport = register();
      setExtraPropertiesFunction(() => ({ appVersion: "1.2.3" }));

      track("Logged", { foo: "bar" });

      expect(transport.log).toHaveBeenCalledWith("track", "Logged", {
        foo: "bar",
        appVersion: "1.2.3",
      });
      expect(transport.track).toHaveBeenCalledWith("Logged", {
        foo: "bar",
        appVersion: "1.2.3",
      });
      expect(events[0]).toEqual(
        expect.objectContaining({
          eventName: "Logged",
          eventProperties: { foo: "bar", appVersion: "1.2.3" },
          eventPropertiesWithoutExtra: { foo: "bar" },
          deliveryStatus: "enqueued",
        }),
      );
    });
  });
});
