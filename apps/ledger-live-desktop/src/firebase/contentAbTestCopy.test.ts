import {
  getContentAbTestCopy,
  getContentAbTests,
  parseContentAbTestCopy,
  setContentAbTestCopy,
  subscribeToContentAbTestCopy,
} from "./contentAbTestCopy";

const value = (raw: string, source: "remote" | "default" | "static" = "remote") => ({
  asString: () => raw,
  getSource: () => source,
});

const experiment = (payload: object, source: "remote" | "default" | "static" = "remote") =>
  value(JSON.stringify(payload), source);

beforeEach(() => {
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
    expect(getContentAbTests()).toEqual({});
  });
});

describe("getContentAbTests", () => {
  it("is empty when no experiment is served", () => {
    expect(getContentAbTests()).toEqual({});
  });

  it("keeps the full payload, including an optional trackingConfiguration", () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Discover Ledger Flex" },
        trackingConfiguration: { ptxEventProperty: "ab_upgrade", ptxEventValue: "variant_b" },
      }),
    });

    expect(getContentAbTests()).toEqual({
      upgradeBanner: {
        enabled: true,
        copy: { "upgrade.banner.title": "Discover Ledger Flex" },
        trackingConfiguration: { ptxEventProperty: "ab_upgrade", ptxEventValue: "variant_b" },
      },
    });
    expect(getContentAbTestCopy()).toEqual({
      "upgrade.banner.title": "Discover Ledger Flex",
    });
  });

  it("includes a valid disabled experiment without overriding copy", () => {
    setContentAbTestCopy({
      feature_copy_upgrade_banner: experiment({
        enabled: false,
        copy: { "upgrade.banner.title": "Hidden" },
      }),
    });

    expect(getContentAbTests()).toEqual({
      upgradeBanner: {
        enabled: false,
        copy: { "upgrade.banner.title": "Hidden" },
      },
    });
    expect(getContentAbTestCopy()).toEqual({});
  });

  it("excludes malformed payloads and a broken trackingConfiguration", () => {
    setContentAbTestCopy({
      feature_copy_broken: value("not json"),
      feature_copy_invalid: experiment({ enabled: "yes", "invalid.key": "Nope" }),
      feature_copy_bad_tracking: experiment({
        enabled: true,
        copy: { "upgrade.banner.title": "Should stay out" },
        trackingConfiguration: {},
      }),
    });

    expect(getContentAbTests()).toEqual({});
    expect(getContentAbTestCopy()).toEqual({});
  });
});
