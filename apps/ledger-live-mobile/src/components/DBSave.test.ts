import { featureFlagsLense, payCardPersistedSelector } from "./DBSave";
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
      payCardOnboardingWidget: { hasCompletedOnboarding: true },
    } as unknown as State;

    const projected = payCardPersistedSelector(state);

    expect(projected).toEqual({
      hasSeenFeatureTour: true,
      hasSeenReceiveVerifyHint: true,
      balanceFilter: "ethereum/erc20/usd__coin",
      hasCompletedOnboarding: true,
    });
  });
});
