import {
  parseContentAbTestPayload,
  parseContentAbTests,
  firebaseKeyToContentAbTestId,
} from "./parse";

const value = (raw: string, source: "remote" | "default" | "static" = "remote") => ({
  asString: () => raw,
  getSource: () => source,
});

describe("firebaseKeyToContentAbTestId", () => {
  it("maps feature_ snake_case keys the same way as existing FF ids", () => {
    expect(firebaseKeyToContentAbTestId("feature_test")).toBe("test");
    expect(firebaseKeyToContentAbTestId("feature_upgrade_banner")).toBe("upgradeBanner");
    expect(firebaseKeyToContentAbTestId("Feature_Test")).toBe("test");
  });

  it("does not invent canonical FeatureIds for digit-splitting firebase keys", () => {
    expect(firebaseKeyToContentAbTestId("feature_web_3_hub")).toBe("web3Hub");
    expect(firebaseKeyToContentAbTestId("feature_ptx_swap_receive_trc_20_without_trx")).toBe(
      "ptxSwapReceiveTrc20WithoutTrx",
    );
  });

  it("returns null for non-feature keys", () => {
    expect(firebaseKeyToContentAbTestId("config_ll_min_version")).toBeNull();
    expect(firebaseKeyToContentAbTestId("stranger")).toBeNull();
    expect(firebaseKeyToContentAbTestId("feature_")).toBeNull();
  });
});

describe("parseContentAbTestPayload", () => {
  it("accepts the Firebase console payload with i18n keys at the top level", () => {
    expect(
      parseContentAbTestPayload({
        enabled: false,
        "upgrade.banner.title": "Discover bigger screen devices",
        "upgrade.banner.description": "Click to see more",
        trackingConfiguration: {
          ptxEventProperty: "large_screen_exp_001",
          ptxEventValue: "proposed_content_001",
        },
      }),
    ).toEqual({
      enabled: false,
      copy: {
        "upgrade.banner.title": "Discover bigger screen devices",
        "upgrade.banner.description": "Click to see more",
      },
      trackingConfiguration: {
        ptxEventProperty: "large_screen_exp_001",
        ptxEventValue: "proposed_content_001",
      },
    });
  });

  it("merges a nested copy object with top-level string keys", () => {
    expect(
      parseContentAbTestPayload({
        enabled: true,
        copy: { "upgrade.banner.title": "From nested" },
        "upgrade.banner.description": "From top level",
      }),
    ).toEqual({
      enabled: true,
      copy: {
        "upgrade.banner.title": "From nested",
        "upgrade.banner.description": "From top level",
      },
    });
  });

  it("accepts enabled-only payloads with empty copy", () => {
    expect(parseContentAbTestPayload({ enabled: false })).toEqual({
      enabled: false,
      copy: {},
    });
  });

  it("returns null when enabled is missing or not a boolean", () => {
    expect(parseContentAbTestPayload({})).toBeNull();
    expect(parseContentAbTestPayload({ enabled: "true" })).toBeNull();
    expect(parseContentAbTestPayload(null)).toBeNull();
  });

  it("returns null when trackingConfiguration is present but invalid", () => {
    expect(
      parseContentAbTestPayload({
        enabled: true,
        trackingConfiguration: { ptxEventProperty: "only-one" },
      }),
    ).toBeNull();
  });
});

describe("parseContentAbTests", () => {
  it("keeps remote feature_* payloads and drops the rest", () => {
    expect(
      parseContentAbTests({
        feature_test: value(
          JSON.stringify({
            enabled: true,
            "upgrade.banner.title": "Hello",
          }),
        ),
        feature_upgrade_banner: value(JSON.stringify({ enabled: false }), "default"),
        config_unrelated: value('"ignored"'),
        feature_broken: value("not json"),
        feature_invalid: value(JSON.stringify({ enabled: "nope" })),
      }),
    ).toEqual({
      test: {
        enabled: true,
        copy: { "upgrade.banner.title": "Hello" },
      },
    });
  });
});
