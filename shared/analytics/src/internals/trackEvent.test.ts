import {
  setAnalytics,
  setExtraPropsFn,
  setMandatoryExtraPropsFn,
  setPropsFilter,
} from "../registry";
import { trackSubject } from "../trackSubject";
import type { Analytics, LoggableEvent, Props } from "../types";
import { trackEvent } from "./trackEvent";

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

const scrubSensitive = (props: Props): Props => {
  const filtered = { ...props };
  delete filtered.sensitive;
  return filtered;
};

beforeEach(() => {
  events.length = 0;
  setAnalytics({ track: jest.fn() });
  setExtraPropsFn(undefined);
  setMandatoryExtraPropsFn(undefined);
  setPropsFilter(undefined);
});

describe("trackEvent", () => {
  describe("enrichment", () => {
    it("sends synchronously for sync extras", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropsFn(() => ({ appVersion: "1.2.3" }));

      const result = trackEvent("track", "Sync Event", {}, false);

      expect(result).toBeUndefined();
      expect(transport.track).toHaveBeenCalledWith("Sync Event", {
        appVersion: "1.2.3",
      });
    });

    it("resolves after sending for async extras", async () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropsFn(async () => ({ appVersion: "1.2.3" }));

      const result = trackEvent("track", "Async Event", {}, false);

      expect(result).toBeInstanceOf(Promise);
      expect(transport.track).not.toHaveBeenCalled();
      await result;
      expect(transport.track).toHaveBeenCalledWith("Async Event", {
        appVersion: "1.2.3",
      });
    });

    it("calls the extra props function with no arguments", () => {
      const transport = createTransport();
      setAnalytics(transport);
      const extraProps = jest.fn(() => ({}));
      setExtraPropsFn(extraProps);

      trackEvent("track", "Stateful", {}, false);

      expect(extraProps).toHaveBeenCalledWith();
    });

    it("lets extra props win over caller props", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropsFn(() => ({ platform: "desktop" }));

      trackEvent("track", "Collision", { platform: "caller-supplied" }, false);

      expect(transport.track).toHaveBeenCalledWith("Collision", {
        platform: "desktop",
      });
    });

    it("uses mandatory extra props for mandatory events", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setMandatoryExtraPropsFn(() => ({ mandatory: "props" }));

      trackEvent("track", "Mandatory Event", { flow: "onboarding" }, true);

      expect(transport.track).toHaveBeenCalledWith("Mandatory Event", {
        flow: "onboarding",
        mandatory: "props",
      });
    });

    it("reports failed_enrichment without rejecting when async extras reject", async () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropsFn(() => Promise.reject(new Error("permission read failed")));

      await expect(
        trackEvent("track", "Unenrichable", { foo: "bar" }, false),
      ).resolves.toBeUndefined();

      expect(transport.track).not.toHaveBeenCalled();
      expect(events).toEqual([
        expect.objectContaining({
          eventName: "Unenrichable",
          eventProps: { foo: "bar" },
          eventPropsWithoutExtra: { foo: "bar" },
          deliveryStatus: "failed_enrichment",
        }),
      ]);
    });

    it("reports failed_enrichment when sync extras throw", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropsFn(() => {
        throw new Error("permission read failed");
      });

      trackEvent("track", "Unenrichable", { foo: "bar" }, false);

      expect(transport.track).not.toHaveBeenCalled();
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
    it("filters caller props before sending", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setPropsFilter(scrubSensitive);

      trackEvent("track", "Tracking Event", { sensitive: "data to filter", theme: "light" }, false);

      expect(transport.track).toHaveBeenCalledWith("Tracking Event", {
        theme: "light",
      });
    });

    it("filters enriched props before sending", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setExtraPropsFn(() => ({ sensitive: "from-enricher", appVersion: "1.2.3" }));
      setPropsFilter(scrubSensitive);

      trackEvent("track", "Enriched Event", { theme: "light" }, false);

      expect(transport.track).toHaveBeenCalledWith("Enriched Event", {
        theme: "light",
        appVersion: "1.2.3",
      });
    });

    it("publishes filtered payloads to trackSubject on success", () => {
      setAnalytics(createTransport());
      setExtraPropsFn(() => ({ sensitive: "from-enricher", appVersion: "1.2.3" }));
      setPropsFilter(scrubSensitive);

      trackEvent("track", "Subject Event", { theme: "light" }, false);

      expect(events[0]).toEqual(
        expect.objectContaining({
          eventName: "Subject Event",
          eventProps: { theme: "light", appVersion: "1.2.3" },
          eventPropsWithoutExtra: { theme: "light" },
        }),
      );
    });

    it("publishes filtered payloads to trackSubject when async extras reject", async () => {
      setAnalytics(createTransport());
      setExtraPropsFn(() => Promise.reject(new Error("permission read failed")));
      setPropsFilter(scrubSensitive);

      await trackEvent(
        "track",
        "Unenrichable",
        { sensitive: "data to filter", theme: "light" },
        false,
      );

      expect(events).toEqual([
        expect.objectContaining({
          eventName: "Unenrichable",
          eventProps: { theme: "light" },
          eventPropsWithoutExtra: { theme: "light" },
          deliveryStatus: "failed_enrichment",
        }),
      ]);
    });

    it("reports failed_filter when the property filter throws", () => {
      const transport = createTransport();
      setAnalytics(transport);
      setPropsFilter(() => {
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
});
