import React from "react";
import { render } from "@tests/test-renderer";
import { PostOnboardingActionId, type StartActionArgs } from "@ledgerhq/types-live";
import { discoverWalletAction } from "../actions";

describe("discoverWalletAction", () => {
  it("should render the discover wallet icon", () => {
    const Icon = discoverWalletAction.Icon;
    const { toJSON } = render(<Icon size="M" color="primary.c80" />);

    expect(toJSON()).toBeTruthy();
  });

  it("should mark the action complete when product tour is completed", () => {
    expect(
      discoverWalletAction.getIsAlreadyCompletedByState?.({
        isLedgerSyncActive: false,
        accounts: [],
        productTourCompleted: true,
      }),
    ).toBe(true);

    expect(
      discoverWalletAction.getIsAlreadyCompletedByState?.({
        isLedgerSyncActive: false,
        accounts: [],
        productTourCompleted: false,
      }),
    ).toBe(false);
  });

  it("should expose discover wallet metadata", () => {
    expect(discoverWalletAction.id).toBe(PostOnboardingActionId.discoverWallet);
    expect(discoverWalletAction.featureFlagId).toBe("lwmProductTour");
    expect(discoverWalletAction.shouldCompleteOnStart).toBe(false);
    const startAction = (discoverWalletAction as { startAction?: (args: StartActionArgs) => void })
      .startAction;
    expect(() => startAction?.({})).not.toThrow();
  });
});
