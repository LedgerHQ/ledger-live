import {
  featureFlagsLense,
  payCardDbSaveSliceSelector,
  payCardPersistedSelector,
  trustchainNotEquals,
} from "./DBSave";
import type { State } from "~/reducers/types";

describe("featureFlagsLense", () => {
  it("projects only { overrides, bannerVisible } — never the transient remoteFlagsReady gate", () => {
    const overrides = { mockFeature: { enabled: true } };
    const state = {
      featureFlags: {
        overrides,
        bannerVisible: false,
        remoteFlagsReady: true,
      },
    } as unknown as State;

    const projected = featureFlagsLense(state);

    expect(projected).toEqual({ overrides, bannerVisible: false });
    expect(projected).not.toHaveProperty("remoteFlagsReady");
  });
});

describe("payCardPersistedSelector (mobile persistence lens)", () => {
  it("composes the pay card flow slices into one persisted blob", () => {
    const state = {
      payCardFeatureTour: { hasSeenFeatureTour: true },
      payRequestVerifyHint: { hasSeenReceiveVerifyHint: true },
      payCardBalance: { balanceFilter: "ethereum/erc20/usd__coin" },
      payCardLoginIntro: { hasSeenLoginIntro: true },
      payCardOnboardingWidget: { hasCompletedOnboarding: true },
    } as unknown as State;

    const projected = payCardPersistedSelector(state);

    expect(projected).toEqual({
      hasSeenFeatureTour: true,
      hasSeenReceiveVerifyHint: true,
      balanceFilter: "ethereum/erc20/usd__coin",
      hasSeenLoginIntro: true,
      hasCompletedOnboarding: true,
    });
  });
});

describe("payCardDbSaveSliceSelector (mobile save trigger)", () => {
  const base = {
    payCardFeatureTour: { hasSeenFeatureTour: false },
    payRequestVerifyHint: { hasSeenReceiveVerifyHint: false },
    payCardBalance: { balanceFilter: "all" },
    payCardLoginIntro: { hasSeenLoginIntro: false },
    payCardOnboardingWidget: { hasCompletedOnboarding: false },
  } as unknown as State;

  it("holds its identity while no pay card slice changes", () => {
    expect(payCardDbSaveSliceSelector(base)).toBe(payCardDbSaveSliceSelector(base));
  });

  it.each([
    "payCardFeatureTour",
    "payRequestVerifyHint",
    "payCardBalance",
    "payCardLoginIntro",
    "payCardOnboardingWidget",
  ] as const)("re-triggers the save when only %s changes", slice => {
    const next = { ...base, [slice]: {} } as unknown as State;

    expect(payCardDbSaveSliceSelector(next)).not.toBe(payCardDbSaveSliceSelector(base));
  });
});

describe("trustchainNotEquals (mobile save trigger)", () => {
  const PROD = {
    version: 1.1,
    trustchain: null,
    memberCredentials: null,
  };
  const state = {
    trustchain: { environment: "PROD", PROD, STAGING: null },
  } as unknown as State;

  it("does not re-trigger the save when only the LKRP environment changes", () => {
    const withEnvironment = {
      trustchain: { environment: "STAGING", PROD, STAGING: null },
    } as unknown as State;

    expect(trustchainNotEquals("PROD")(state, withEnvironment)).toBe(false);
    expect(trustchainNotEquals("STAGING")(state, withEnvironment)).toBe(false);
  });

  it("re-triggers only the PROD save when the PROD record changes", () => {
    const withProdCredentials = {
      trustchain: {
        environment: "PROD",
        PROD: {
          ...PROD,
          memberCredentials: { pubkey: "pubkey", privatekey: "privatekey" },
        },
        STAGING: null,
      },
    } as unknown as State;

    expect(trustchainNotEquals("PROD")(state, withProdCredentials)).toBe(true);
    expect(trustchainNotEquals("STAGING")(state, withProdCredentials)).toBe(false);
  });

  it("re-triggers only the STAGING save when the STAGING record changes", () => {
    const withStagingCredentials = {
      trustchain: {
        environment: "STAGING",
        PROD,
        STAGING: {
          version: 1.1,
          trustchain: null,
          memberCredentials: { pubkey: "pubkey", privatekey: "privatekey" },
        },
      },
    } as unknown as State;

    expect(trustchainNotEquals("PROD")(state, withStagingCredentials)).toBe(false);
    expect(trustchainNotEquals("STAGING")(state, withStagingCredentials)).toBe(true);
  });
});
