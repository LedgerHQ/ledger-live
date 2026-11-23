jest.mock("./internals/trackEvent", () => ({
  trackEvent: jest.fn(),
}));

import { setEnabledFn } from "./registry";
import { resetTrackingPages, setTrackingSource } from "./screenRefs";
import { trackEvent } from "./internals/trackEvent";
import { z } from "zod";
import { track } from "./track";
import { trackPage } from "./trackPage";

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

describe("track props types", () => {
  const Secret = z.string().brand<"AccountKey">().brand<"Sensitive">();
  const key = Secret.parse("xpub");

  it("accepts props, an error and no props", async () => {
    await track("event", { network: "bitcoin", count: 1 });
    await track("event", new Error("down"));
    await track("event", null);
    await track("event");
    expect(trackEvent).toHaveBeenCalledTimes(4);
  });

  it("refuses a Sensitive value, at any depth", async () => {
    // @ts-expect-error an account key in the props
    await track("event", { key });
    // @ts-expect-error an account key nested in the props
    await track("event", { account: { keys: [key] } });
    // @ts-expect-error an account key in page props
    await trackPage({ category: "Receive", props: { key } });
    expect(trackEvent).toHaveBeenCalled();
  });

  it("takes a union of props through an explicit type argument", async () => {
    const pick = (flow?: string): Readonly<{ count: number }> | Readonly<{ flow: string }> =>
      flow ? { flow } : { count: 0 };
    const props = pick("sync");
    type SyncProps = ReturnType<typeof pick>;
    await track<SyncProps>("event", props);
    await trackPage<SyncProps>({ category: "Sync", props });
    expect(trackEvent).toHaveBeenCalled();
  });

  it("keeps the parameters of the generic signatures readable", () => {
    const calls: Parameters<typeof trackPage>[] = [[{ category: "Receive" }]];
    expect(calls.map(([page]) => page.category)).toEqual(["Receive"]);
  });
});
