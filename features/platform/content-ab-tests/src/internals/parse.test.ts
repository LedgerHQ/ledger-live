import {
  enabledContentAbTestCopy,
  enabledContentAbTestTracking,
  parseContentAbTests,
} from "./parse";

const value = (raw: string, source: "remote" | "default" | "static" = "remote") => ({
  asString: () => raw,
  getSource: () => source,
});
const experiment = (payload: object, source: "remote" | "default" | "static" = "remote") =>
  value(JSON.stringify(payload), source);

describe("parseContentAbTests", () => {
  it("keys experiments by in-app id and keeps any tracking pairs", () => {
    expect(
      parseContentAbTests({
        feature_copy_upgrade_banner: experiment({
          enabled: true,
          copy: { "upgrade.banner.title": "Discover Ledger Flex" },
          trackingConfiguration: { ab_upgrade: "variant_b", cohort: "q3" },
        }),
      }),
    ).toEqual({
      upgradeBanner: {
        enabled: true,
        copy: { "upgrade.banner.title": "Discover Ledger Flex" },
        trackingConfiguration: { ab_upgrade: "variant_b", cohort: "q3" },
      },
    });
  });

  it("keeps disabled experiments", () => {
    expect(
      parseContentAbTests({
        feature_copy_upgrade_banner: experiment({
          enabled: false,
          copy: { "upgrade.banner.title": "Hidden" },
        }),
      }),
    ).toEqual({
      upgradeBanner: { enabled: false, copy: { "upgrade.banner.title": "Hidden" } },
    });
  });

  it("drops keys defined outside enabled, copy and trackingConfiguration", () => {
    expect(
      parseContentAbTests({
        feature_copy_upgrade_banner: experiment({
          enabled: true,
          copy: { "upgrade.banner.title": "From copy" },
          "upgrade.banner.description": "From top level",
        }),
      }),
    ).toEqual({
      upgradeBanner: { enabled: true, copy: { "upgrade.banner.title": "From copy" } },
    });
  });

  it("ignores feature flags, config keys and non-remote values", () => {
    expect(
      parseContentAbTests({
        feature_counter_value: experiment({
          enabled: true,
          "some.key": "From a flag",
        }),
        config_ll_min_version: value('"ignored"'),
        feature_copy_default: experiment(
          { enabled: true, copy: { "default.key": "From defaults" } },
          "default",
        ),
      }),
    ).toEqual({});
  });

  it("skips malformed payloads and a non-string tracking value", () => {
    expect(
      parseContentAbTests({
        feature_copy_broken: value("not json"),
        feature_copy_invalid: experiment({
          enabled: "yes",
          copy: { "invalid.key": "Nope" },
        }),
        feature_copy_untyped: experiment({ enabled: true, copy: { "untyped.key": 42 } }),
        feature_copy_missing: experiment({ enabled: true }),
        feature_copy_bad_tracking: experiment({
          enabled: true,
          copy: { "tracking.key": "Nope" },
          trackingConfiguration: { variant: 2 },
        }),
      }),
    ).toEqual({});
  });
});

describe("enabledContentAbTestCopy", () => {
  it("merges the copy of enabled experiments only", () => {
    expect(
      enabledContentAbTestCopy({
        upgradeBanner: {
          enabled: true,
          copy: {
            "upgrade.banner.title": "Discover bigger screen devices",
            "upgrade.banner.description": "Click to see more",
          },
        },
        hiddenBanner: { enabled: false, copy: { "hidden.key": "Hidden" } },
      }),
    ).toEqual({
      "upgrade.banner.title": "Discover bigger screen devices",
      "upgrade.banner.description": "Click to see more",
    });
  });
});

describe("enabledContentAbTestTracking", () => {
  it("keeps the tracking pairs of enabled experiments, keyed by id", () => {
    expect(
      enabledContentAbTestTracking({
        upgradeBanner: {
          enabled: true,
          copy: {},
          trackingConfiguration: { ab_upgrade: "variant_b", cohort: "q3" },
        },
        swapCta: { enabled: true, copy: {}, trackingConfiguration: { cohort: "control" } },
      }),
    ).toEqual({
      upgradeBanner: { ab_upgrade: "variant_b", cohort: "q3" },
      swapCta: { cohort: "control" },
    });
  });

  it("leaves out disabled experiments and experiments without tracking pairs", () => {
    expect(
      enabledContentAbTestTracking({
        hiddenBanner: {
          enabled: false,
          copy: {},
          trackingConfiguration: { ab_hidden: "variant_b" },
        },
        untracked: { enabled: true, copy: {} },
        emptyTracking: { enabled: true, copy: {}, trackingConfiguration: {} },
      }),
    ).toEqual({});
  });
});
