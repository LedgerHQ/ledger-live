import {
  setAnalytics,
  setEnabledFn,
  setExtraPropsFn,
  setMandatoryExtraPropsFn,
  setPropsFilter,
} from "./registry";
import { analyticsEvents$ } from "./analyticsEvents";
import { track } from "./track";
import type { Analytics, LoggableEvent, Props } from "./types";

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

const register = (analyticsClient = createAnalyticsClient()) => {
  setAnalytics(analyticsClient);
  setEnabledFn(() => true);
  return analyticsClient;
};

beforeEach(() => {
  events.length = 0;
  setAnalytics({ track: jest.fn() });
  setEnabledFn(() => true);
  setExtraPropsFn(undefined);
  setMandatoryExtraPropsFn(undefined);
  setPropsFilter(undefined);
});

describe("track", () => {
  describe("consent", () => {
    it("sends event props and extra props when tracking is enabled", () => {
      const analyticsClient = register();
      setExtraPropsFn(() => ({ extra: "props" }));

      track("Analytics Event", { event: "props" });

      expect(analyticsClient.track).toHaveBeenCalledWith("Analytics Event", {
        event: "props",
        extra: "props",
      });
    });

    it("does not send non-mandatory events when tracking is disabled", () => {
      const analyticsClient = register();
      setEnabledFn(() => false);

      track("Analytics Consent", { flow: "onboarding" });

      expect(analyticsClient.track).not.toHaveBeenCalled();
    });

    it("sends mandatory events with mandatory props when tracking is disabled", () => {
      const analyticsClient = register();
      setEnabledFn(() => false);
      setMandatoryExtraPropsFn(() => ({ mandatory: "props" }));

      track("Analytics Consent", { flow: "onboarding" }, { mandatory: true });

      expect(analyticsClient.track).toHaveBeenCalledWith("Analytics Consent", {
        flow: "onboarding",
        mandatory: "props",
      });
    });
  });

  describe("enrichment", () => {
    it("sends synchronously for a sync enricher", () => {
      const analyticsClient = register();
      setExtraPropsFn(() => ({ appVersion: "1.2.3" }));

      const result = track("Sync Event");

      expect(result).toBeUndefined();
      expect(analyticsClient.track).toHaveBeenCalledWith("Sync Event", {
        appVersion: "1.2.3",
      });
    });

    it("resolves after sending for an async enricher", async () => {
      const analyticsClient = register();
      setExtraPropsFn(async () => ({ appVersion: "1.2.3" }));

      const result = track("Async Event");

      expect(result).toBeInstanceOf(Promise);
      expect(analyticsClient.track).not.toHaveBeenCalled();
      await result;
      expect(analyticsClient.track).toHaveBeenCalledWith("Async Event", {
        appVersion: "1.2.3",
      });
    });
  });

  describe("property filter", () => {
    it("filters props before sending", () => {
      const analyticsClient = register();
      setPropsFilter((props: Props) => {
        const filtered = { ...props };
        delete filtered.sensitive;
        return filtered;
      });

      track("Tracking Event", { sensitive: "data to filter", theme: "light" });

      expect(analyticsClient.track).toHaveBeenCalledWith("Tracking Event", {
        theme: "light",
      });
    });
  });

  describe("observability", () => {
    it("logs before sending and publishes to analyticsEvents$", () => {
      const analyticsClient = register();
      setExtraPropsFn(() => ({ appVersion: "1.2.3" }));

      track("Logged", { foo: "bar" });

      expect(analyticsClient.log).toHaveBeenCalledWith("track", "Logged", {
        foo: "bar",
        appVersion: "1.2.3",
      });
      expect(analyticsClient.track).toHaveBeenCalledWith("Logged", {
        foo: "bar",
        appVersion: "1.2.3",
      });
      expect(events[0]).toEqual(
        expect.objectContaining({
          eventName: "Logged",
          eventProps: { foo: "bar", appVersion: "1.2.3" },
          eventPropsWithoutExtra: { foo: "bar" },
          deliveryStatus: "enqueued",
        }),
      );
    });
  });
});
