import { featureFlagsLense, payCardDbSaveSliceSelector, payCardPersistedSelector } from "./DBSave";
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
