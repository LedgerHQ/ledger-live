jest.mock("./internals/trackEvent", () => ({
  trackEvent: jest.fn(),
}));

import { setEnabledFn } from "./registry";
import {
  currentRouteNameRef,
  getCurrentTrackingPage,
  getPreviousTrackingPage,
  previousRouteNameRef,
} from "./screenRefs";
import { trackEvent } from "./internals/trackEvent";
import { resetLastPageEventName } from "./internals/trackPage.internals";
import { trackPage } from "./trackPage";

const register = () => {
  setEnabledFn(() => true);
};

beforeEach(() => {
  jest.mocked(trackEvent).mockReset();
  setEnabledFn(() => true);
  currentRouteNameRef.current = undefined;
  previousRouteNameRef.current = undefined;
  resetLastPageEventName();
});

describe("trackPage", () => {
  it("delegates to trackEvent when tracking is enabled", () => {
    register();

    trackPage({ category: "Market" });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "page",
      eventName: "Page Market",
      props: {},
      mandatory: false,
    });
  });

  it("does not delegate when tracking is disabled", () => {
    register();
    setEnabledFn(() => false);

    trackPage({ category: "Market" });

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("delegates mandatory page events even when tracking is disabled", () => {
    register();
    setEnabledFn(() => false);

    trackPage({ category: "Market" }, { mandatory: true });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "page",
      eventName: "Page Market",
      props: {},
      mandatory: true,
    });
  });

  it("builds the event name from category only", () => {
    register();

    trackPage({ category: "Market" });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "page",
      eventName: "Page Market",
      props: {},
      mandatory: false,
    });
  });

  it("builds the event name from category and name", () => {
    register();

    trackPage({ category: "Modal send", name: "step recipient" });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "page",
      eventName: "Page Modal send step recipient",
      props: {},
      mandatory: false,
    });
  });

  it("builds the event name from name only", () => {
    register();

    trackPage({ name: "step recipient" });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "page",
      eventName: "Page step recipient",
      props: {},
      mandatory: false,
    });
  });

  it("builds the event name when category and name are empty", () => {
    register();

    trackPage({});

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "page",
      eventName: "Page ",
      props: {},
      mandatory: false,
    });
  });

  it("updates previous and current route when updateRoutes and refreshSource are true", () => {
    register();
    currentRouteNameRef.current = "Page Portfolio";

    trackPage({ category: "Market" }, { updateRoutes: true, refreshSource: true });

    expect(getPreviousTrackingPage()).toBe("Page Portfolio");
    expect(getCurrentTrackingPage()).toBe("Market");
  });

  it("does not update current route when refreshSource is not true", () => {
    register();
    currentRouteNameRef.current = "Page Portfolio";

    trackPage({ category: "Market" }, { updateRoutes: true });

    expect(getPreviousTrackingPage()).toBe("Page Portfolio");
    expect(getCurrentTrackingPage()).toBe("Page Portfolio");
  });

  it("injects source from the previous tracking page", () => {
    register();
    previousRouteNameRef.current = "Page Portfolio";

    trackPage({ category: "Market" });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "page",
      eventName: "Page Market",
      props: { source: "Page Portfolio" },
      mandatory: false,
    });
  });

  it("omits source when the previous tracking page is unknown", () => {
    register();

    trackPage({ category: "Market" });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "page",
      eventName: "Page Market",
      props: {},
      mandatory: false,
    });
  });

  it("allows caller to override source prop", () => {
    register();
    previousRouteNameRef.current = "Page Portfolio";

    trackPage({ category: "Market", props: { source: "Custom source" } });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "page",
      eventName: "Page Market",
      props: { source: "Custom source" },
      mandatory: false,
    });
  });

  it("skips duplicate page events when avoidDuplicates is true", () => {
    register();

    trackPage({ category: "Market" }, { avoidDuplicates: true });
    trackPage({ category: "Market" }, { avoidDuplicates: true });

    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("records duplicate page events when avoidDuplicates is false", () => {
    register();

    trackPage({ category: "Market" });
    trackPage({ category: "Market" });

    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it("returns a promise that settles when trackEvent resolves", async () => {
    register();
    let resolveTrackEvent: (() => void) | undefined;
    jest.mocked(trackEvent).mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveTrackEvent = resolve;
        }),
    );

    let settled = false;
    const pending = trackPage({ category: "Market" });
    expect(pending).toBeInstanceOf(Promise);

    void pending?.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveTrackEvent?.();
    await pending;
    expect(settled).toBe(true);
  });

  it("returns undefined when tracking is disabled and the event is not mandatory", () => {
    register();
    setEnabledFn(() => false);

    const result = trackPage({ category: "Market" });

    expect(result).toBeUndefined();
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
