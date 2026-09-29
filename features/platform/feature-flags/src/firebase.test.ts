/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { FeatureMap } from "@shared/feature-flags";
import {
  formatDefaultFeatures,
  formatToFirebaseFeatureId,
  parseContentAbTestCopy,
  parseFirebaseFeatures,
} from "./firebase";

describe("formatToFirebaseFeatureId", () => {
  it("prefixes feature_ and snake_cases the id", () => {
    expect(formatToFirebaseFeatureId("ptxCard")).toBe("feature_ptx_card");
  });

  it("matches lodash snakeCase for ids with digits / consecutive caps", () => {
    expect(formatToFirebaseFeatureId("web3hub")).toBe("feature_web_3_hub");
    expect(formatToFirebaseFeatureId("ptxSwapReceiveTRC20WithoutTrx")).toBe(
      "feature_ptx_swap_receive_trc_20_without_trx",
    );
  });
});

describe("formatDefaultFeatures", () => {
  it("keys each entry by its Firebase id with a JSON-stringified value", () => {
    const config = {
      ptxCard: { enabled: true },
      mockFeature: { enabled: false, params: { batch: 1 } },
    } as unknown as FeatureMap;

    expect(formatDefaultFeatures(config)).toEqual({
      feature_ptx_card: JSON.stringify({ enabled: true }),
      feature_mock_feature: JSON.stringify({ enabled: false, params: { batch: 1 } }),
    });
  });
});

describe("parseFirebaseFeatures", () => {
  const value = (raw: string, source: "remote" | "default" | "static" = "remote") => ({
    asString: () => raw,
    getSource: () => source,
  });

  it("maps known Firebase keys to FeatureIds and drops unknown ones", () => {
    expect(
      parseFirebaseFeatures({
        feature_counter_value: value(JSON.stringify({ enabled: true })),
        config_unrelated: value('"ignored"'),
        stranger_key: value('"ignored"'),
        feature_unknown_flag: value('"ignored"'),
      }),
    ).toEqual({ counterValue: { enabled: true } });
  });

  it("resolves ids whose snake_case round-trip through camelCase would be lossy", () => {
    expect(
      parseFirebaseFeatures({
        feature_web_3_hub: value(JSON.stringify({ enabled: true })),
        feature_ptx_swap_receive_trc_20_without_trx: value(JSON.stringify({ enabled: true })),
      }),
    ).toEqual({
      web3hub: { enabled: true },
      ptxSwapReceiveTRC20WithoutTrx: { enabled: true },
    });
  });

  it("matches keys case-insensitively, since snakeCase always lowercases", () => {
    expect(
      parseFirebaseFeatures({ Feature_Counter_Value: value(JSON.stringify({ enabled: true })) }),
    ).toEqual({ counterValue: { enabled: true } });
  });

  it("drops entries the SDK served from the seeded defaults", () => {
    // `getAll` unions the activated config with `defaultConfig`. Only the former came from the
    // backend; keeping the latter would record a compiled default as a remote value.
    expect(
      parseFirebaseFeatures({
        feature_counter_value: value(JSON.stringify({ enabled: true }), "remote"),
        feature_lld_wallet_sync: value(JSON.stringify({ enabled: false }), "default"),
        feature_llm_wallet_sync: value(JSON.stringify({ enabled: false }), "static"),
      }),
    ).toEqual({ counterValue: { enabled: true } });
  });

  it("drops keys whose value is not valid JSON", () => {
    expect(
      parseFirebaseFeatures({
        feature_counter_value: value(JSON.stringify({ enabled: true })),
        feature_lwd_wallet_40: value("not json"),
      }),
    ).toEqual({ counterValue: { enabled: true } });
  });
});

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
