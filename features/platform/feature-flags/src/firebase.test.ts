/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { FeatureMap } from "@shared/feature-flags";
import { formatDefaultFeatures, formatToFirebaseFeatureId } from "./firebase";

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
