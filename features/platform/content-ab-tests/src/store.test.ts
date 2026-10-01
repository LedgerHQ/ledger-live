import {
  clearContentAbTestOverrides,
  getContentAbTestCopy,
  getContentAbTests,
  isContentAbTestOverridden,
  parseContentAbTestPayload,
  setContentAbTestCopy,
  setContentAbTestOverride,
  subscribeToContentAbTestCopy,
} from "./store";

const value = (raw: string, source: "remote" | "default" | "static" = "remote") => ({
  asString: () => raw,
  getSource: () => source,
});

const experiment = (payload: object, source: "remote" | "default" | "static" = "remote") =>
  value(JSON.stringify(payload), source);

beforeEach(() => {
  clearContentAbTestOverrides();
  setContentAbTestCopy({});
});

describe("setContentAbTestCopy", () => {
  it("publishes the merged copy to subscribers", () => {
    const seen: unknown[] = [];
    const unsubscribe = subscribeToContentAbTestCopy(copy => {
      seen.push(copy);
    });

    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
      }),
    });
    unsubscribe();

    expect(getContentAbTestCopy()).toEqual({
      "upgrade.banner.title": "Remote",
    });
    expect(seen).toEqual([{ "upgrade.banner.title": "Remote" }]);
  });

  it("does not notify subscribers when a poll returns the same copy", () => {
    const payload = {
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
      }),
    };
    setContentAbTestCopy(payload);

    const callback = jest.fn();
    subscribeToContentAbTestCopy(callback);
    const republished = setContentAbTestCopy(payload);

    expect(callback).not.toHaveBeenCalled();
    expect(republished).toBe(getContentAbTestCopy());
  });

  it("clears the copy when the experiment stops being served", () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
      }),
    });

    expect(setContentAbTestCopy({})).toEqual({});
  });
});

describe("content A/B test debug overrides", () => {
  it("keeps disabled experiments in the debug list without applying copy", () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: false,
        copy: { "upgrade.banner.title": "Hidden" },
      }),
    });

    expect(getContentAbTests()).toEqual({
      upgradeBanner: { enabled: false, copy: { "upgrade.banner.title": "Hidden" } },
    });
    expect(getContentAbTestCopy()).toEqual({});
  });

  it("applies a local override and restores the remote payload", () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
      }),
    });

    setContentAbTestOverride("upgradeBanner", {
      enabled: false,
      copy: { "upgrade.banner.title": "Mocked" },
    });

    expect(isContentAbTestOverridden("upgradeBanner")).toBe(true);
    expect(getContentAbTestCopy()).toEqual({});

    setContentAbTestOverride("upgradeBanner", undefined);

    expect(isContentAbTestOverridden("upgradeBanner")).toBe(false);
    expect(getContentAbTestCopy()).toEqual({ "upgrade.banner.title": "Remote" });
  });

  it("keeps a local override when a later poll returns the same remote payload", () => {
    const payload = {
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
      }),
    };
    setContentAbTestCopy(payload);
    setContentAbTestOverride("upgradeBanner", {
      enabled: true,
      copy: { "upgrade.banner.title": "Mocked" },
    });

    setContentAbTestCopy(payload);

    expect(getContentAbTestCopy()).toEqual({ "upgrade.banner.title": "Mocked" });
    expect(isContentAbTestOverridden("upgradeBanner")).toBe(true);
  });

  it("drops a malformed trackingConfiguration and still applies the copy", () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Remote" },
        trackingConfiguration: {},
      }),
    });

    expect(getContentAbTests()).toEqual({
      upgradeBanner: { enabled: true, copy: { "upgrade.banner.title": "Remote" } },
    });
    expect(getContentAbTestCopy()).toEqual({ "upgrade.banner.title": "Remote" });
    expect(parseContentAbTestPayload({ enabled: true, copy: { "banner.title": "Hi" } })).toEqual({
      enabled: true,
      copy: { "banner.title": "Hi" },
    });
    expect(
      parseContentAbTestPayload({
        enabled: true,
        copy: { "banner.title": "Hi" },
        trackingConfiguration: { experiment: "variant-a" },
      }),
    ).toEqual({
      enabled: true,
      copy: { "banner.title": "Hi" },
      trackingConfiguration: { experiment: "variant-a" },
    });
  });
});
