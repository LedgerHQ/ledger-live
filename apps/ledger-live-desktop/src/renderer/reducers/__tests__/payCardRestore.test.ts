import type { UnknownAction } from "@reduxjs/toolkit";
import { restorePayCardBalanceFilter } from "@features/flow-pay-balance/state";
import { restorePayCardFeatureTour } from "@features/flow-pay-feature-tour/state";
import {
  restorePayCardLoginIntro,
  restorePayCardProviderApp,
} from "@features/flow-pay-card-auth/state";
import { restoreReceiveVerifyHint } from "@features/flow-pay-request/state";
import rootReducer from "..";

describe("the payCard blob restored into the desktop store", () => {
  const blob = {
    hasSeenFeatureTour: true,
    hasSeenReceiveVerifyHint: true,
    balanceFilter: "ethereum/erc20/usd__coin",
    hasSeenLoginIntro: true,
    providerAppId: "ledger-us",
  };

  function restoreAll(payCardState: Record<string, unknown>) {
    return [
      restorePayCardFeatureTour(payCardState),
      restoreReceiveVerifyHint(payCardState),
      restorePayCardBalanceFilter(payCardState),
      restorePayCardLoginIntro(payCardState),
      restorePayCardProviderApp(payCardState),
    ].reduce(
      (state, action) => rootReducer(state, action as UnknownAction),
      rootReducer(undefined, { type: "@@INIT" }),
    );
  }

  it("lands every field of one blob in its own slice", () => {
    const state = restoreAll(blob);

    expect(state.payCardFeatureTour.hasSeenFeatureTour).toBe(true);
    expect(state.payRequestVerifyHint.hasSeenReceiveVerifyHint).toBe(true);
    expect(state.payCardBalance.balanceFilter).toBe("ethereum/erc20/usd__coin");
    expect(state.payCardLoginIntro.hasSeenLoginIntro).toBe(true);
    expect(state.payCardProviderApp.providerAppId).toBe("ledger-us");
  });

  it("leaves a slice at its initial state when an older blob carries no field for it", () => {
    const state = restoreAll({ hasSeenFeatureTour: true, balanceFilter: "all" });

    expect(state.payCardFeatureTour.hasSeenFeatureTour).toBe(true);
    expect(state.payCardLoginIntro.hasSeenLoginIntro).toBe(false);
    expect(state.payCardProviderApp.providerAppId).toBeNull();
  });

  it("keeps the runtime auth slice out of the restore", () => {
    const state = restoreAll(blob);

    expect(state.payCardAuth).toEqual({ hasCard: false, status: "unknown" });
  });
});
