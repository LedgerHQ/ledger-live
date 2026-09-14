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

    trackPage("Market");

    expect(trackEvent).toHaveBeenCalledWith("page", "Page Market", {}, { mandatory: false });
  });

  it("does not delegate when tracking is disabled", () => {
    register();
    setEnabledFn(() => false);

    trackPage("Market");

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("delegates mandatory page events even when tracking is disabled", () => {
    register();
    setEnabledFn(() => false);

    trackPage("Market", null, null, { mandatory: true });

    expect(trackEvent).toHaveBeenCalledWith("page", "Page Market", {}, { mandatory: true });
  });

  it("builds the event name from category only", () => {
    register();

    trackPage("Market");

    expect(trackEvent).toHaveBeenCalledWith("page", "Page Market", {}, { mandatory: false });
  });

  it("builds the event name from category and name", () => {
    register();

    trackPage("Modal send", "step recipient");

    expect(trackEvent).toHaveBeenCalledWith(
      "page",
      "Page Modal send step recipient",
      {},
      { mandatory: false },
    );
  });

  it("builds the event name from name only", () => {
    register();

    trackPage(undefined, "step recipient");

    expect(trackEvent).toHaveBeenCalledWith(
      "page",
      "Page step recipient",
      {},
      { mandatory: false },
    );
  });

  it("builds the event name when category and name are empty", () => {
    register();

    trackPage();

    expect(trackEvent).toHaveBeenCalledWith("page", "Page ", {}, { mandatory: false });
  });

  it("updates previous and current route when updateRoutes and refreshSource are true", () => {
    register();
    currentRouteNameRef.current = "Page Portfolio";

    trackPage("Market", null, null, { updateRoutes: true, refreshSource: true });

    expect(getPreviousTrackingPage()).toBe("Page Portfolio");
    expect(getCurrentTrackingPage()).toBe("Market");
  });

  it("does not update current route when refreshSource is not true", () => {
    register();
    currentRouteNameRef.current = "Page Portfolio";

    trackPage("Market", null, null, { updateRoutes: true });

    expect(getPreviousTrackingPage()).toBe("Page Portfolio");
    expect(getCurrentTrackingPage()).toBe("Page Portfolio");
  });

  it("injects source from the previous tracking page", () => {
    register();
    previousRouteNameRef.current = "Page Portfolio";

    trackPage("Market");

    expect(trackEvent).toHaveBeenCalledWith(
      "page",
      "Page Market",
      { source: "Page Portfolio" },
      { mandatory: false },
    );
  });

  it("omits source when the previous tracking page is unknown", () => {
    register();

    trackPage("Market");

    expect(trackEvent).toHaveBeenCalledWith("page", "Page Market", {}, { mandatory: false });
  });

  it("allows caller to override source prop", () => {
    register();
    previousRouteNameRef.current = "Page Portfolio";

    trackPage("Market", null, { source: "Custom source" });

    expect(trackEvent).toHaveBeenCalledWith(
      "page",
      "Page Market",
      { source: "Custom source" },
      { mandatory: false },
    );
  });

  it("skips duplicate page events when avoidDuplicates is true", () => {
    register();

    trackPage("Market", null, null, { avoidDuplicates: true });
    trackPage("Market", null, null, { avoidDuplicates: true });

    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("records duplicate page events when avoidDuplicates is false", () => {
    register();

    trackPage("Market");
    trackPage("Market");

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
    const pending = trackPage("Market");
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

    const result = trackPage("Market");

    expect(result).toBeUndefined();
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
