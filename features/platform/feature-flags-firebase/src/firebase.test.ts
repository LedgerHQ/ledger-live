/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import type { FeatureMap } from "@shared/feature-flags";
import {
  formatDefaultFeatures,
  formatToFirebaseFeatureId,
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

const remote = (raw: string) => ({ asString: () => raw, getSource: () => "remote" });

describe("earnSolanaHighlightedValidators", () => {
  const FIREBASE_KEY = "feature_earn_solana_highlighted_validators";
  const flagValue = {
    enabled: true,
    params: {
      validators: [
        { voteAccount: "ExampleVoteAccountA11111111111111111111111", provider: "Provider A" },
      ],
    },
  };

  it("is stored under the key that the Firebase owner edits", () => {
    expect(formatToFirebaseFeatureId("earnSolanaHighlightedValidators")).toBe(FIREBASE_KEY);
  });

  it("maps that key back to the flag id with its validators", () => {
    expect(parseFirebaseFeatures({ [FIREBASE_KEY]: remote(JSON.stringify(flagValue)) })).toEqual({
      earnSolanaHighlightedValidators: flagValue,
    });
  });

  it.each([
    "feature_earn_solana_highlighted_validator",
    "feature_solana_highlighted_validators",
    "feature_earn_highlighted_validators",
  ])("does not read the near-miss key %s", key => {
    expect(parseFirebaseFeatures({ [key]: remote(JSON.stringify(flagValue)) })).toEqual({});
  });

  it("is seeded disabled with no validator in the Firebase defaults", () => {
    expect(formatDefaultFeatures(FEATURE_FLAGS_DEFAULTS)[FIREBASE_KEY]).toBe(
      JSON.stringify({ enabled: false, params: { validators: [] } }),
    );
  });
});
