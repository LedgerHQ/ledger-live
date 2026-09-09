import {
  setAnalytics,
  setEnricher,
  setMandatoryEnricher,
  setPropertyFilter,
  setAnalyticsStore,
  setIsTrackingEnabledSelector,
} from "./registry";
import { track } from "./track";
import { trackSubject } from "./trackSubject";
import type { AnalyticsTransport, DeliveryStatus, LoggableEvent, Props } from "./types";

const events: LoggableEvent[] = [];
trackSubject.subscribe(event => events.push(event));

const state = { settings: { shareAnalytics: true } };

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
  setAnalyticsStore({ getState: () => state });
  setIsTrackingEnabledSelector(() => true);
  return transport;
};

beforeEach(() => {
  events.length = 0;
  setAnalytics({ track: jest.fn() });
  setAnalyticsStore({ getState: () => state });
  setIsTrackingEnabledSelector(() => true);
  setEnricher(undefined);
  setMandatoryEnricher(undefined);
  setPropertyFilter(undefined);
});

let transport: jest.Mocked<AnalyticsTransport>;

describe("enabled/disabled", () => {
  beforeEach(() => {
    transport = register();
    setEnricher(() => ({ extra: "props" }));
    setMandatoryEnricher(() => ({ mandatory: "props" }));
  });

  describe("with tracking enabled", () => {
    beforeEach(() => {
      setIsTrackingEnabledSelector(() => true);
    });

    it("sends event properties and extra properties", () => {
      track("Analytics Event", { event: "props" });

      expect(transport.track).toHaveBeenCalledWith("Analytics Event", {
        event: "props",
        extra: "props",
      });
    });

    it("sends mandatory properties only for mandatory events", () => {
      track("Analytics Event", { event: "props" }, { mandatory: true });

      expect(transport.track).toHaveBeenCalledWith("Analytics Event", {
        event: "props",
        mandatory: "props",
      });
    });
  });

  describe("with tracking disabled", () => {
    beforeEach(() => {
      setIsTrackingEnabledSelector(() => false);
    });

    it("non-mandatory events are not sent", () => {
      track("Analytics Consent", { flow: "onboarding" });

      expect(transport.track).not.toHaveBeenCalled();
    });

    it("mandatory events send mandatory properties only", () => {
      track("Analytics Consent", { flow: "onboarding" }, { mandatory: true });

      expect(transport.track).toHaveBeenCalledWith("Analytics Consent", {
        flow: "onboarding",
        mandatory: "props",
      });
    });
  });
});

describe("enrichment", () => {
  it("emits synchronously for a sync enricher", () => {
    const transport = register();
    setEnricher(() => ({ appVersion: "1.2.3" }));

    const result = track("Sync Event");

    expect(result).toBeUndefined();
    expect(transport.track).toHaveBeenCalledWith("Sync Event", {
      appVersion: "1.2.3",
    });
    expect(events).toHaveLength(1);
  });

  it("resolves after the transport was called for an async enricher", async () => {
    const transport = register();
    setEnricher(async () => ({ appVersion: "1.2.3" }));

    const result = track("Async Event");

    expect(result).toBeInstanceOf(Promise);
    expect(transport.track).not.toHaveBeenCalled();
    await result;
    expect(transport.track).toHaveBeenCalledWith("Async Event", {
      appVersion: "1.2.3",
    });
  });

  it("reports failed without rejecting when an async enricher rejects", async () => {
    const transport = register();
    setEnricher(() => Promise.reject(new Error("permission read failed")));

    await expect(track("Unenrichable", { foo: "bar" })).resolves.toBeUndefined();

    expect(transport.track).not.toHaveBeenCalled();
    expect(events).toEqual([
      expect.objectContaining({
        eventName: "Unenrichable",
        eventProperties: { foo: "bar" },
        deliveryStatus: "failed",
      }),
    ]);
  });

  it("passes the store state to the enricher", () => {
    register();
    const enricher = jest.fn(() => ({}));
    setEnricher(enricher);

    track("Stateful");

    expect(enricher).toHaveBeenCalledWith(state);
  });

  it("lets the extra properties win over the caller's", () => {
    const transport = register();
    setEnricher(() => ({ platform: "desktop" }));

    track("Collision", { platform: "caller-supplied" });

    expect(transport.track).toHaveBeenCalledWith("Collision", {
      platform: "desktop",
    });
  });
});

describe("property filter", () => {
  const scrubSensitive = (properties: Props): Props => {
    const filtered = { ...properties };
    delete filtered.sensitive;
    return filtered;
  };

  it("runs the properties through the property filter before sending", () => {
    const transport = register();
    setPropertyFilter(scrubSensitive);

    track("Tracking Event", { sensitive: "data to filter", theme: "light" });

    expect(transport.track).toHaveBeenCalledWith("Tracking Event", {
      theme: "light",
    });
  });

  it("filters enriched properties before sending", () => {
    const transport = register();
    setEnricher(() => ({ sensitive: "from-enricher", appVersion: "1.2.3" }));
    setPropertyFilter(scrubSensitive);

    track("Enriched Event", { theme: "light" });

    expect(transport.track).toHaveBeenCalledWith("Enriched Event", {
      theme: "light",
      appVersion: "1.2.3",
    });
  });

  it("publishes filtered payloads to trackSubject on success", () => {
    register();
    setEnricher(() => ({ sensitive: "from-enricher", appVersion: "1.2.3" }));
    setPropertyFilter(scrubSensitive);

    track("Subject Event", { theme: "light" });

    expect(events[0]).toEqual(
      expect.objectContaining({
        eventName: "Subject Event",
        eventProperties: { theme: "light", appVersion: "1.2.3" },
        eventPropertiesWithoutExtra: { theme: "light" },
      }),
    );
  });

  it("publishes filtered payloads to trackSubject when an async enricher rejects", async () => {
    register();
    setEnricher(() => Promise.reject(new Error("permission read failed")));
    setPropertyFilter(scrubSensitive);

    await track("Unenrichable", { sensitive: "data to filter", theme: "light" });

    expect(events).toEqual([
      expect.objectContaining({
        eventName: "Unenrichable",
        eventProperties: { theme: "light" },
        eventPropertiesWithoutExtra: { theme: "light" },
        deliveryStatus: "failed",
      }),
    ]);
  });

  it("filters the merged payload once when extras are present", () => {
    register();
    setEnricher(() => ({ appVersion: "1.2.3" }));
    const filter = jest.fn(scrubSensitive);
    setPropertyFilter(filter);

    track("Filtered Once", { sensitive: "data to filter", theme: "light" });

    expect(filter).toHaveBeenCalledTimes(2);
    expect(filter.mock.calls[0][0]).toEqual({
      sensitive: "data to filter",
      theme: "light",
    });
    expect(filter.mock.calls[1][0]).toEqual({
      theme: "light",
      appVersion: "1.2.3",
    });
  });

  it("filters the base payload once when no extras are present", () => {
    register();
    const filter = jest.fn(scrubSensitive);
    setPropertyFilter(filter);

    track("Filtered Base", { sensitive: "data to filter", theme: "light" });

    expect(filter).toHaveBeenCalledTimes(1);
    expect(filter.mock.calls[0][0]).toEqual({
      sensitive: "data to filter",
      theme: "light",
    });
  });
});

describe("error properties", () => {
  it("preserves an Error input under the error key", () => {
    const transport = register();
    const error = new Error("something went wrong");

    track("Error Event", error);

    expect(transport.track).toHaveBeenCalledWith("Error Event", {
      error,
    });
  });
});

describe("delivery status", () => {
  it("defaults to enqueued for a synchronous transport", () => {
    register();

    track("Enqueued");

    expect(events[0].deliveryStatus).toBe("enqueued");
  });

  it("lets the transport override the default status", async () => {
    register(
      createTransport({
        track: async () => "skipped_no_token" as DeliveryStatus,
      }),
    );

    await track("Overridden");

    expect(events[0].deliveryStatus).toBe("skipped_no_token");
  });

  it("defaults to enqueued for a transport resolving nothing", async () => {
    register(createTransport({ track: async () => {} }));

    await track("Async Void");

    expect(events[0].deliveryStatus).toBe("enqueued");
  });

  it("reports failed when the transport throws", () => {
    register(
      createTransport({
        track: () => {
          throw new Error("segment is down");
        },
      }),
    );

    expect(() => track("Throwing")).not.toThrow();
    expect(events[0].deliveryStatus).toBe("failed");
  });

  it("reports failed without rejecting when the transport rejects", async () => {
    register(
      createTransport({
        track: async () => Promise.reject(new Error("segment is down")),
      }),
    );

    await expect(track("Rejecting")).resolves.toBeUndefined();
    expect(events[0].deliveryStatus).toBe("failed");
  });

  it("reports the payload without the extra properties alongside the enriched one", () => {
    register();
    setEnricher(() => ({ appVersion: "1.2.3" }));

    track("Both Payloads", { foo: "bar" });

    expect(events[0]).toEqual({
      date: expect.any(Date),
      deliveryStatus: "enqueued",
      eventName: "Both Payloads",
      eventProperties: { foo: "bar", appVersion: "1.2.3" },
      eventPropertiesWithoutExtra: { foo: "bar" },
    });
  });
});

describe("log", () => {
  it("logs a track event before sending it", () => {
    const transport = register();

    track("Logged", { foo: "bar" });

    expect(transport.log).toHaveBeenCalledWith("track", "Logged", {
      foo: "bar",
    });

    expect(transport.track).toHaveBeenCalledWith("Logged", { foo: "bar" });
  });
});
