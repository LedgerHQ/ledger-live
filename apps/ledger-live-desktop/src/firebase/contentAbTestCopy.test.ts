import {
  clearContentAbTestOverrides,
  getContentAbTestCopy,
  getContentAbTests,
  isContentAbTestOverridden,
  parseContentAbTestCopy,
  parseContentAbTestPayload,
  setContentAbTestCopy,
  setContentAbTestOverride,
  subscribeToContentAbTestCopy,
} from "./contentAbTestCopy";

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

describe("parseContentAbTestCopy", () => {
  it("collects copy from enabled feature_copy_ experiments", () => {
    expect(
      parseContentAbTestCopy({
        feature_copy_upgrade_banner: experiment({
          enabled: true,
          "upgrade.banner.title": "Discover bigger screen devices",
          "upgrade.banner.description": "Click to see more",
        }),
      }),
    ).toEqual({
      "upgrade.banner.title": "Discover bigger screen devices",
      "upgrade.banner.description": "Click to see more",
    });
  });

  it("merges a nested copy object with top-level string keys", () => {
    expect(
      parseContentAbTestCopy({
        feature_copy_upgrade_banner: experiment({
          enabled: true,
          copy: { "upgrade.banner.title": "From nested" },
          "upgrade.banner.description": "From top level",
        }),
      }),
    ).toEqual({
      "upgrade.banner.title": "From nested",
      "upgrade.banner.description": "From top level",
    });
  });

  it("ignores feature flags, config keys and non-remote values", () => {
    expect(
      parseContentAbTestCopy({
        feature_counter_value: experiment({
          enabled: true,
          "some.key": "From a flag",
        }),
        config_ll_min_version: value('"ignored"'),
        feature_copy_cached: experiment(
          { enabled: true, "cached.key": "From defaults" },
          "default",
        ),
      }),
    ).toEqual({});
  });

  it("ignores disabled experiments and malformed payloads", () => {
    expect(
      parseContentAbTestCopy({
        feature_copy_disabled: experiment({
          enabled: false,
          "disabled.key": "Hidden",
        }),
        feature_copy_broken: value("not json"),
        feature_copy_invalid: experiment({
          enabled: "yes",
          "invalid.key": "Nope",
        }),
        feature_copy_untyped: experiment({ enabled: true, "untyped.key": 42 }),
      }),
    ).toEqual({});
  });
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
        "upgrade.banner.title": "Remote",
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
        "upgrade.banner.title": "Remote",
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
        "upgrade.banner.title": "Remote",
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

  it("rejects a malformed trackingConfiguration and accepts a missing one", () => {
    expect(
      parseContentAbTestPayload({ enabled: true, copy: {}, trackingConfiguration: {} }),
    ).toBeNull();
    expect(parseContentAbTestPayload({ enabled: true, copy: { "banner.title": "Hi" } })).toEqual({
      enabled: true,
      copy: { "banner.title": "Hi" },
    });
  });
});
