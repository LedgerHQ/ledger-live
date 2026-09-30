import { parseContentAbTestCopy } from "./parse";

describe("parseContentAbTestCopy", () => {
  const value = (raw: string, source: "remote" | "default" | "static" = "remote") => ({
    asString: () => raw,
    getSource: () => source,
  });
  const experiment = (payload: object, source: "remote" | "default" | "static" = "remote") =>
    value(JSON.stringify(payload), source);

  it("collects copy from enabled feature_copy_ experiments", () => {
    expect(
      parseContentAbTestCopy({
        feature_copy_upgrade_banner: experiment({
          enabled: true,
          copy: {
            "upgrade.banner.title": "Discover bigger screen devices",
            "upgrade.banner.description": "Click to see more",
          },
        }),
      }),
    ).toEqual({
      "upgrade.banner.title": "Discover bigger screen devices",
      "upgrade.banner.description": "Click to see more",
    });
  });

  it("ignores translation keys defined outside copy", () => {
    expect(
      parseContentAbTestCopy({
        feature_copy_upgrade_banner: experiment({
          enabled: true,
          copy: { "upgrade.banner.title": "From copy" },
          "upgrade.banner.description": "From top level",
        }),
      }),
    ).toEqual({
      "upgrade.banner.title": "From copy",
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
        feature_copy_default: experiment(
          { enabled: true, copy: { "default.key": "From defaults" } },
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
          copy: { "disabled.key": "Hidden" },
        }),
        feature_copy_broken: value("not json"),
        feature_copy_invalid: experiment({
          enabled: "yes",
          copy: { "invalid.key": "Nope" },
        }),
        feature_copy_untyped: experiment({ enabled: true, copy: { "untyped.key": 42 } }),
        feature_copy_missing: experiment({ enabled: true }),
      }),
    ).toEqual({});
  });
});
