import {
  setAnalytics,
  setExtraPropsFn,
  setMandatoryExtraPropsFn,
  setPropsFilter,
} from "../registry";
import type { Analytics, LoggableEvent, Props } from "../types";
import { analyticsEvents$ } from "./eventLog";
import { trackEvent } from "./trackEvent";

const events: LoggableEvent[] = [];
let sub: ReturnType<typeof analyticsEvents$.subscribe>;

beforeAll(() => {
  sub = analyticsEvents$.subscribe(event => events.push(event));
});

afterAll(() => {
  sub.unsubscribe();
});

const createAnalyticsClient = ({
  track = jest.fn(),
  log = jest.fn(),
}: Partial<Analytics> = {}): jest.Mocked<Analytics> =>
  ({
    track: jest.fn(track),
    log: jest.fn(log),
  }) as unknown as jest.Mocked<Analytics>;

const scrubSensitive = (props: Props): Props => {
  const filtered = { ...props };
  delete filtered.sensitive;
  return filtered;
};

beforeEach(() => {
  events.length = 0;
  setAnalytics(undefined);
  setExtraPropsFn(undefined);
  setMandatoryExtraPropsFn(undefined);
  setPropsFilter(undefined);
});

describe("trackEvent", () => {
  describe("enrichment", () => {
    it("sends with sync extras", async () => {
      const analyticsClient = createAnalyticsClient();
      setAnalytics(analyticsClient);
      setExtraPropsFn(() => ({ appVersion: "1.2.3" }));

      await trackEvent({ kind: "track", eventName: "Sync Event", props: {} });

      expect(analyticsClient.track).toHaveBeenCalledWith("Sync Event", {
        appVersion: "1.2.3",
      });
    });

    it("sends after async extras resolve", async () => {
      const analyticsClient = createAnalyticsClient();
      setAnalytics(analyticsClient);
      let resolveExtras: (value: Props) => void = () => {};
      setExtraPropsFn(
        () =>
          new Promise<Props>(resolve => {
            resolveExtras = resolve;
          }),
      );

      const pending = trackEvent({ kind: "track", eventName: "Async Event", props: {} });

      expect(analyticsClient.track).not.toHaveBeenCalled();
      resolveExtras({ appVersion: "1.2.3" });
      await pending;
      expect(analyticsClient.track).toHaveBeenCalledWith("Async Event", {
        appVersion: "1.2.3",
      });
    });

    it("calls the extra props function with no arguments", async () => {
      const analyticsClient = createAnalyticsClient();
      setAnalytics(analyticsClient);
      const extraProps = jest.fn(() => ({}));
      setExtraPropsFn(extraProps);

      await trackEvent({ kind: "track", eventName: "Stateful", props: {} });

      expect(extraProps).toHaveBeenCalledWith();
    });

    it("lets extra props win over caller props", async () => {
      const analyticsClient = createAnalyticsClient();
      setAnalytics(analyticsClient);
      setExtraPropsFn(() => ({ platform: "desktop" }));

      await trackEvent({
        kind: "track",
        eventName: "Collision",
        props: { platform: "caller-supplied" },
      });

      expect(analyticsClient.track).toHaveBeenCalledWith("Collision", {
        platform: "desktop",
      });
    });

    it("uses mandatory extra props for mandatory events", async () => {
      const analyticsClient = createAnalyticsClient();
      setAnalytics(analyticsClient);
      setMandatoryExtraPropsFn(() => ({ mandatory: "props" }));

      await trackEvent({
        kind: "track",
        eventName: "Mandatory Event",
        props: { flow: "onboarding" },
        mandatory: true,
      });

      expect(analyticsClient.track).toHaveBeenCalledWith("Mandatory Event", {
        flow: "onboarding",
        mandatory: "props",
      });
    });

    it("reports failed_enrichment without rejecting when async extras reject", async () => {
      const analyticsClient = createAnalyticsClient();
      setAnalytics(analyticsClient);
      setExtraPropsFn(() => Promise.reject(new Error("permission read failed")));

      await expect(
        trackEvent({ kind: "track", eventName: "Unenrichable", props: { foo: "bar" } }),
      ).resolves.toBeUndefined();

      expect(analyticsClient.track).not.toHaveBeenCalled();
      expect(events).toEqual([
        expect.objectContaining({
          eventName: "Unenrichable",
          eventProps: { foo: "bar" },
          eventPropsWithoutExtra: { foo: "bar" },
          deliveryStatus: "failed_enrichment",
        }),
      ]);
    });

    it("reports failed_enrichment when sync extras throw", async () => {
      const analyticsClient = createAnalyticsClient();
      setAnalytics(analyticsClient);
      setExtraPropsFn(() => {
        throw new Error("permission read failed");
      });

      await trackEvent({ kind: "track", eventName: "Unenrichable", props: { foo: "bar" } });

      expect(analyticsClient.track).not.toHaveBeenCalled();
      expect(events).toEqual([
        expect.objectContaining({
          eventName: "Unenrichable",
          eventProps: { foo: "bar" },
          eventPropsWithoutExtra: { foo: "bar" },
          deliveryStatus: "failed_enrichment",
        }),
      ]);
    });
  });

  describe("property filter", () => {
    it("filters caller props before sending", async () => {
      const analyticsClient = createAnalyticsClient();
      setAnalytics(analyticsClient);
      setPropsFilter(scrubSensitive);

      await trackEvent({
        kind: "track",
        eventName: "Tracking Event",
        props: { sensitive: "data to filter", theme: "light" },
      });

      expect(analyticsClient.track).toHaveBeenCalledWith("Tracking Event", {
        theme: "light",
      });
    });

    it("filters enriched props before sending", async () => {
      const analyticsClient = createAnalyticsClient();
      setAnalytics(analyticsClient);
      setExtraPropsFn(() => ({ sensitive: "from-enricher", appVersion: "1.2.3" }));
      setPropsFilter(scrubSensitive);

      await trackEvent({ kind: "track", eventName: "Enriched Event", props: { theme: "light" } });

      expect(analyticsClient.track).toHaveBeenCalledWith("Enriched Event", {
        theme: "light",
        appVersion: "1.2.3",
      });
    });

    it("publishes filtered payloads to analyticsEvents$ on success", async () => {
      setAnalytics(createAnalyticsClient());
      setExtraPropsFn(() => ({ sensitive: "from-enricher", appVersion: "1.2.3" }));
      setPropsFilter(scrubSensitive);

      await trackEvent({ kind: "track", eventName: "Subject Event", props: { theme: "light" } });

      expect(events[0]).toEqual(
        expect.objectContaining({
          eventName: "Subject Event",
          eventProps: { theme: "light", appVersion: "1.2.3" },
          eventPropsWithoutExtra: { theme: "light" },
        }),
      );
    });

    it("publishes filtered payloads to analyticsEvents$ when async extras reject", async () => {
      setAnalytics(createAnalyticsClient());
      setExtraPropsFn(() => Promise.reject(new Error("permission read failed")));
      setPropsFilter(scrubSensitive);

      await trackEvent({
        kind: "track",
        eventName: "Unenrichable",
        props: { sensitive: "data to filter", theme: "light" },
      });

      expect(events).toEqual([
        expect.objectContaining({
          eventName: "Unenrichable",
          eventProps: { theme: "light" },
          eventPropsWithoutExtra: { theme: "light" },
          deliveryStatus: "failed_enrichment",
        }),
      ]);
    });

    it("reports failed_filter when the property filter throws", async () => {
      const analyticsClient = createAnalyticsClient();
      setAnalytics(analyticsClient);
      setPropsFilter(() => {
        throw new Error("filter failed");
      });

      await trackEvent({ kind: "track", eventName: "Filtered Event", props: { theme: "light" } });

      expect(analyticsClient.track).not.toHaveBeenCalled();
      expect(events).toEqual([
        expect.objectContaining({
          eventName: "Filtered Event",
          deliveryStatus: "failed_filter",
        }),
      ]);
    });

    it("reports failed_filter when the property filter throws after enrichment succeeds", async () => {
      const analyticsClient = createAnalyticsClient();
      setAnalytics(analyticsClient);
      setExtraPropsFn(() => ({ appVersion: "1.2.3" }));
      setPropsFilter(props => {
        if ("appVersion" in props) {
          throw new Error("filter failed on enriched payload");
        }
        return scrubSensitive(props);
      });

      await trackEvent({
        kind: "track",
        eventName: "Enriched Filter Failure",
        props: { theme: "light" },
      });

      expect(analyticsClient.track).not.toHaveBeenCalled();
      expect(events).toEqual([
        expect.objectContaining({
          eventName: "Enriched Filter Failure",
          deliveryStatus: "failed_filter",
        }),
      ]);
    });
  });
});
