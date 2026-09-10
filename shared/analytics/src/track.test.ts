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
  setAnalytics(undefined);
  setEnabledFn(() => true);
  setExtraPropsFn(undefined);
  setMandatoryExtraPropsFn(undefined);
  setPropsFilter(undefined);
});

describe("track", () => {
  describe("consent", () => {
    it("sends event props and extra props when tracking is enabled", async () => {
      const analyticsClient = register();
      setExtraPropsFn(() => ({ extra: "props" }));

      await track("Analytics Event", { event: "props" });

      expect(analyticsClient.track).toHaveBeenCalledWith("Analytics Event", {
        event: "props",
        extra: "props",
      });
    });

    it("does not send non-mandatory events when tracking is disabled", async () => {
      const analyticsClient = register();
      setEnabledFn(() => false);

      await track("Analytics Consent", { flow: "onboarding" });

      expect(analyticsClient.track).not.toHaveBeenCalled();
    });

    it("sends mandatory events with mandatory props when tracking is disabled", async () => {
      const analyticsClient = register();
      setEnabledFn(() => false);
      setMandatoryExtraPropsFn(() => ({ mandatory: "props" }));

      await track("Analytics Consent", { flow: "onboarding" }, { mandatory: true });

      expect(analyticsClient.track).toHaveBeenCalledWith("Analytics Consent", {
        flow: "onboarding",
        mandatory: "props",
      });
    });
  });

  describe("enrichment", () => {
    it("sends with sync extras", async () => {
      const analyticsClient = register();
      setExtraPropsFn(() => ({ appVersion: "1.2.3" }));

      await track("Sync Event");

      expect(analyticsClient.track).toHaveBeenCalledWith("Sync Event", {
        appVersion: "1.2.3",
      });
    });

    it("sends after async extras resolve", async () => {
      const analyticsClient = register();
      let resolveExtras: (value: Props) => void = () => {};
      setExtraPropsFn(
        () =>
          new Promise<Props>(resolve => {
            resolveExtras = resolve;
          }),
      );

      const pending = track("Async Event");

      expect(analyticsClient.track).not.toHaveBeenCalled();
      resolveExtras({ appVersion: "1.2.3" });
      await pending;
      expect(analyticsClient.track).toHaveBeenCalledWith("Async Event", {
        appVersion: "1.2.3",
      });
    });
  });

  describe("property filter", () => {
    it("filters props before sending", async () => {
      const analyticsClient = register();
      setPropsFilter((props: Props) => {
        const filtered = { ...props };
        delete filtered.sensitive;
        return filtered;
      });

      await track("Tracking Event", { sensitive: "data to filter", theme: "light" });

      expect(analyticsClient.track).toHaveBeenCalledWith("Tracking Event", {
        theme: "light",
      });
    });
  });

  describe("observability", () => {
    it("logs before sending and publishes to analyticsEvents$", async () => {
      const analyticsClient = register();
      setExtraPropsFn(() => ({ appVersion: "1.2.3" }));

      await track("Logged", { foo: "bar" });

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
