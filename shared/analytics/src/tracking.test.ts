import { currentRouteNameRef, previousRouteNameRef } from "./internals/screenRefs";
import {
  setAnalytics,
  setEnricher,
  setMandatoryEnricher,
  setPropertyFilter,
  setStore,
  setTrackingSelector,
} from "./registry";
import { closeAndFlush, flush, screen, track, trackPage } from "./tracking";
import { trackSubject } from "./trackSubject";
import type { AnalyticsTransport, DeliveryStatus, LoggableEvent, Props } from "./types";

const events: LoggableEvent[] = [];
trackSubject.subscribe(event => events.push(event));

const state = { settings: { shareAnalytics: true } };

const createTransport = (
  track: AnalyticsTransport["track"] = jest.fn(),
): jest.Mocked<AnalyticsTransport> =>
  ({
    track: jest.fn(track),
    log: jest.fn(),
    flush: jest.fn(async () => {}),
    closeAndFlush: jest.fn(async () => {}),
  }) as unknown as jest.Mocked<AnalyticsTransport>;

const register = (transport = createTransport()) => {
  setAnalytics(transport);
  setStore({ getState: () => state });
  setTrackingSelector(() => true);
  return transport;
};

beforeEach(() => {
  events.length = 0;
  setAnalytics(undefined);
  setStore(undefined);
  setTrackingSelector(undefined);
  setEnricher(undefined);
  setMandatoryEnricher(undefined);
  setPropertyFilter(undefined);
  currentRouteNameRef.current = undefined;
  previousRouteNameRef.current = undefined;
});

describe("consent", () => {
  it("tracks with no selector and no store registered", () => {
    const transport = register();
    setTrackingSelector(undefined);
    setStore(undefined);

    track("CLI Event", { foo: "bar" });

    expect(transport.track).toHaveBeenCalledWith("CLI Event", { page: undefined, foo: "bar" });
  });

  it("reports skipped_no_store and sends nothing when a selector is registered without a store", () => {
    const transport = register();
    setStore(undefined);

    track("No Store", { foo: "bar" });

    expect(transport.track).not.toHaveBeenCalled();
    expect(events).toEqual([
      expect.objectContaining({
        eventName: "No Store",
        eventProperties: { foo: "bar" },
        deliveryStatus: "skipped_no_store",
      }),
    ]);
  });

  it("strips an Error payload from the skipped_no_store report", () => {
    register();
    setStore(undefined);

    track("Boom", new Error("nope"));

    expect(events[0].eventProperties).toBeUndefined();
  });

  it("stays silent on trackSubject when consent is refused", () => {
    const transport = register();
    setTrackingSelector(() => false);

    track("Refused");

    expect(transport.track).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it("sends the mandatory properties and not the enricher's when consent is refused", () => {
    const transport = register();
    setTrackingSelector(() => false);
    setEnricher(() => ({ secret: "personal" }));
    setMandatoryEnricher(() => ({ optInAnalytics: false }));

    track("Analytics Consent", { flow: "onboarding" }, true);

    expect(transport.track).toHaveBeenCalledWith("Analytics Consent", {
      page: undefined,
      flow: "onboarding",
      optInAnalytics: false,
    });
  });

  it("still sends the mandatory properties and not the enricher's when consent is granted", () => {
    const transport = register();
    setEnricher(() => ({ secret: "personal" }));
    setMandatoryEnricher(() => ({ optInAnalytics: true }));

    track("Analytics Consent", { flow: "onboarding" }, true);

    expect(transport.track).toHaveBeenCalledWith("Analytics Consent", {
      page: undefined,
      flow: "onboarding",
      optInAnalytics: true,
    });
  });

  it("sends no extra properties for a mandatory event when no mandatory enricher is registered", () => {
    const transport = register();
    setTrackingSelector(() => false);
    setEnricher(() => ({ secret: "personal" }));

    track("Analytics Consent", null, true);

    expect(transport.track).toHaveBeenCalledWith("Analytics Consent", { page: undefined });
  });
});

describe("enrichment", () => {
  it("emits synchronously for a sync enricher", () => {
    const transport = register();
    setEnricher(() => ({ appVersion: "1.2.3" }));

    const result = track("Sync Event");

    expect(result).toBeUndefined();
    expect(transport.track).toHaveBeenCalledWith("Sync Event", {
      page: undefined,
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
      page: undefined,
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
        eventProperties: { page: undefined, foo: "bar" },
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
      page: undefined,
      platform: "desktop",
    });
  });
});

describe("property filter", () => {
  const scrubbingFilter = (properties: Props): Props => ({
    ...properties,
    ...(properties.page ? { page: "scrubbed" } : {}),
    ...(properties.source ? { source: "scrubbed" } : {}),
  });

  it("hands the filter a page key even when no route has been visited", () => {
    register();
    const filter = jest.fn((properties: Props) => properties);
    setPropertyFilter(filter);

    track("Unvisited");

    expect(Object.keys(filter.mock.calls[0][0])).toContain("page");
  });

  it("hands the filter a source key even when no route has been visited", () => {
    register();
    const filter = jest.fn((properties: Props) => properties);
    setPropertyFilter(filter);

    trackPage("Portfolio");

    expect(Object.keys(filter.mock.calls[0][0])).toContain("source");
  });

  it("scrubs the ref-derived page of a track event", () => {
    const transport = register();
    currentRouteNameRef.current = "Account 0xdeadbeef";
    setPropertyFilter(scrubbingFilter);

    track("Filtered");

    expect(transport.track).toHaveBeenCalledWith("Filtered", { page: "scrubbed" });
  });

  it("scrubs the ref-derived source of a page event", () => {
    const transport = register();
    currentRouteNameRef.current = "Account 0xdeadbeef";
    setPropertyFilter(scrubbingFilter);

    trackPage("Portfolio", undefined, undefined, true, true);

    expect(transport.track).toHaveBeenCalledWith("Page Portfolio", { source: "scrubbed" });
  });

  it("does not let the filter override the extra properties", () => {
    const transport = register();
    setEnricher(() => ({ page: "from-enricher" }));
    currentRouteNameRef.current = "Market";
    setPropertyFilter(scrubbingFilter);

    track("Filtered");

    expect(transport.track).toHaveBeenCalledWith("Filtered", { page: "from-enricher" });
  });
});

describe("trackPage", () => {
  it("sends a track event named after the category and name", () => {
    const transport = register();

    trackPage("Analytics Consent", "Optional", { flow: "test-flow" });

    expect(transport.track).toHaveBeenCalledWith("Page Analytics Consent Optional", {
      source: undefined,
      flow: "test-flow",
    });
  });

  it("omits the name from the event when it is not given", () => {
    const transport = register();

    trackPage("Portfolio");

    expect(transport.track).toHaveBeenCalledWith("Page Portfolio", { source: undefined });
  });

  it("reports the previous page as the source of the next one", () => {
    const transport = register();

    trackPage("Portfolio", undefined, undefined, true, true);
    trackPage("Market", undefined, undefined, true, true);

    expect(transport.track).toHaveBeenLastCalledWith("Page Market", { source: "Portfolio" });
    expect(currentRouteNameRef.current).toBe("Market");
  });

  it("leaves the current page untouched without refreshSource", () => {
    register();
    currentRouteNameRef.current = "Portfolio";

    trackPage("Some Drawer", undefined, undefined, true, false);

    expect(currentRouteNameRef.current).toBe("Portfolio");
    expect(previousRouteNameRef.current).toBe("Portfolio");
  });

  it("updates the route refs even when the consent gate blocks the event", () => {
    register();
    setTrackingSelector(() => false);

    trackPage("Portfolio", undefined, undefined, true, true);

    expect(currentRouteNameRef.current).toBe("Portfolio");
    expect(events).toEqual([]);
  });
});

describe("screen", () => {
  it("sends a track event named after the category and name", () => {
    const transport = register();

    screen("Asset", "Bitcoin", { ticker: "BTC" });

    expect(transport.track).toHaveBeenCalledWith("Page Asset Bitcoin", {
      source: undefined,
      ticker: "BTC",
    });
  });

  it("tolerates a missing category", () => {
    const transport = register();

    screen(undefined, "Bitcoin");

    expect(transport.track).toHaveBeenCalledWith("Page Bitcoin", { source: undefined });
  });

  it("suppresses a repeat of the same screen event when avoiding duplicates", () => {
    const transport = register();

    screen("Portfolio", "Duplicated", undefined, true, true, true);
    screen("Portfolio", "Duplicated", undefined, true, true, true);

    expect(transport.track).toHaveBeenCalledTimes(1);
  });

  it("stays silent on trackSubject when consent is refused", () => {
    const transport = register();
    setTrackingSelector(() => false);

    screen("Portfolio", "Blocked");

    expect(transport.track).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it("emits a repeat of the same screen event when not avoiding duplicates", () => {
    const transport = register();

    screen("Portfolio", "Repeated", undefined, true, true, false);
    screen("Portfolio", "Repeated", undefined, true, true, false);

    expect(transport.track).toHaveBeenCalledTimes(2);
  });
});

describe("delivery status", () => {
  it("defaults to enqueued for a synchronous transport", () => {
    register();

    track("Enqueued");

    expect(events[0].deliveryStatus).toBe("enqueued");
  });

  it("reports skipped_no_client when no transport is registered", () => {
    setStore({ getState: () => state });
    setTrackingSelector(() => true);

    track("No Client");

    expect(events[0].deliveryStatus).toBe("skipped_no_client");
  });

  it("lets the transport override the default status", async () => {
    register(createTransport(async () => "skipped_no_token" as DeliveryStatus));

    await track("Overridden");

    expect(events[0].deliveryStatus).toBe("skipped_no_token");
  });

  it("defaults to enqueued for a transport resolving nothing", async () => {
    register(createTransport(async () => {}));

    await track("Async Void");

    expect(events[0].deliveryStatus).toBe("enqueued");
  });

  it("reports failed when the transport throws", () => {
    register(
      createTransport(() => {
        throw new Error("segment is down");
      }),
    );

    expect(() => track("Throwing")).not.toThrow();
    expect(events[0].deliveryStatus).toBe("failed");
  });

  it("reports failed without rejecting when the transport rejects", async () => {
    register(createTransport(async () => Promise.reject(new Error("segment is down"))));

    await expect(track("Rejecting")).resolves.toBeUndefined();
    expect(events[0].deliveryStatus).toBe("failed");
  });

  it("reports the payload without the extra properties alongside the full one", () => {
    register();
    setEnricher(() => ({ appVersion: "1.2.3" }));

    track("Both Payloads", { foo: "bar" });

    expect(events[0]).toEqual(
      expect.objectContaining({
        eventName: "Both Payloads",
        eventProperties: { page: undefined, foo: "bar", appVersion: "1.2.3" },
        eventPropertiesWithoutExtra: { page: undefined, foo: "bar" },
      }),
    );
  });
});

describe("transport logging", () => {
  it("logs a track event before sending it", () => {
    const transport = register();

    track("Logged", { foo: "bar" });

    expect(transport.log).toHaveBeenCalledWith("track", "Logged", { page: undefined, foo: "bar" });
  });

  it("logs a page event with the page kind", () => {
    const transport = register();

    trackPage("Portfolio");

    expect(transport.log).toHaveBeenCalledWith("page", "Page Portfolio", { source: undefined });
  });
});

describe("clean-up", () => {
  it("delegates flush to the transport", async () => {
    const transport = register();

    await flush();

    expect(transport.flush).toHaveBeenCalled();
  });

  it("delegates closeAndFlush to the transport", async () => {
    const transport = register();

    await closeAndFlush();

    expect(transport.closeAndFlush).toHaveBeenCalled();
  });

  it("resolves when no transport is registered", async () => {
    await expect(flush()).resolves.toBeUndefined();
    await expect(closeAndFlush()).resolves.toBeUndefined();
  });
});
