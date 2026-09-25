jest.mock("./internals/trackEvent", () => ({
  trackEvent: jest.fn(),
}));

import { setEnabledFn } from "./registry";
import { resetTrackingPages, setTrackingSource } from "./screenRefs";
import { trackEvent } from "./internals/trackEvent";
import { track } from "./track";

const register = () => {
  setEnabledFn(() => true);
};

beforeEach(() => {
  jest.mocked(trackEvent).mockReset();
  setEnabledFn(() => true);
  resetTrackingPages();
});

describe("track", () => {
  it("delegates to trackEvent when tracking is enabled", async () => {
    register();

    await track("Analytics Event", { event: "props" });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "track",
      eventName: "Analytics Event",
      props: { event: "props" },
      mandatory: false,
    });
  });

  it("does not delegate when tracking is disabled", async () => {
    register();
    setEnabledFn(() => false);

    await track("Analytics Consent", { flow: "onboarding" });

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("delegates mandatory events even when tracking is disabled", async () => {
    register();
    setEnabledFn(() => false);

    await track("Analytics Consent", { flow: "onboarding" }, { mandatory: true });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "track",
      eventName: "Analytics Consent",
      props: { flow: "onboarding" },
      mandatory: true,
    });
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
    const pending = track("Analytics Event", { event: "props" });
    expect(pending).toBeInstanceOf(Promise);

    void pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveTrackEvent?.();
    await pending;
    expect(settled).toBe(true);
  });

  it("returns a resolved promise when tracking is disabled and not mandatory", async () => {
    register();
    setEnabledFn(() => false);

    await expect(track("Analytics Consent", { flow: "onboarding" })).resolves.toBeUndefined();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("injects the current tracking page if it has been set", async () => {
    register();
    setTrackingSource("Page Market");

    await track("Analytics Event", { event: "props" });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "track",
      eventName: "Analytics Event",
      props: { page: "Page Market", event: "props" },
      mandatory: false,
    });
  });

  it("allows caller to override page prop", async () => {
    register();
    setTrackingSource("Page from ref");

    await track("Analytics Event", { page: "Page from event", event: "props" });

    expect(trackEvent).toHaveBeenCalledWith({
      kind: "track",
      eventName: "Analytics Event",
      props: { page: "Page from event", event: "props" },
      mandatory: false,
    });
  });
});
