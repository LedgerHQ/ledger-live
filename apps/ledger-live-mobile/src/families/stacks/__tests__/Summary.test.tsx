import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import type { StacksAccount } from "@ledgerhq/live-common/families/stacks/types";
import { ScreenName } from "~/const";
import Summary from "../UnstakingFlow/Summary";
import { makeStacksAccount, makeStakingPosition, POOL_ADDRESS } from "../__mocks__/account.mock";
import { bridgeState, DEFAULT_STATUS, resetBridgeState } from "../__mocks__/bridge.mock";

let mockAccount: StacksAccount = makeStacksAccount();

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: mockAccount, parentAccount: undefined }),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => jest.requireActual("../__mocks__/bridge.mock").mockBridge,
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: (...args: unknown[]) =>
    jest.requireActual("../__mocks__/bridge.mock").useFakeBridgeTransaction(...args),
}));

const navigate = jest.fn();

const renderScreen = () =>
  render(
    <Summary
      navigation={{ navigate } as never}
      route={
        {
          name: ScreenName.StacksUnstakingSummary,
          params: { accountId: mockAccount.id },
        } as never
      }
    />,
  );

describe("Stacks unstaking Summary", () => {
  beforeEach(() => {
    resetBridgeState();
    navigate.mockReset();
  });

  it("builds an undelegate transaction against the position's pool", () => {
    mockAccount = makeStacksAccount({}, [makeStakingPosition()]);
    renderScreen();

    expect(screen.getByTestId("stacks-unstake-unlock-cycle-value")).toHaveTextContent("48");
    fireEvent.press(screen.getByTestId("stacks-unstake-summary-continue"));

    expect(navigate).toHaveBeenCalledWith(
      ScreenName.StacksUnstakingSelectDevice,
      expect.objectContaining({
        transaction: expect.objectContaining({ mode: "undelegate", valAddress: POOL_ADDRESS }),
      }),
    );
  });

  it("hides the unlock cycle when the position doesn't carry pox-5 cycle details", () => {
    mockAccount = makeStacksAccount({}, [makeStakingPosition({ details: {} })]);
    renderScreen();

    expect(screen.getByTestId("stacks-unstake-staked-value")).toBeVisible();
    expect(screen.queryByTestId("stacks-unstake-unlock-cycle-value")).toBeNull();
  });

  it("offers Retry when preparation settles with only a status error", () => {
    mockAccount = makeStacksAccount({}, [makeStakingPosition()]);
    bridgeState.status = {
      ...DEFAULT_STATUS,
      errors: { recipient: new Error("RecipientRequired") },
    };
    renderScreen();

    expect(screen.getByTestId("stacks-unstake-retry")).toBeVisible();
    expect(screen.getByTestId("stacks-unstake-summary-continue")).toBeDisabled();
  });

  // useBridgeTransaction never settles a failed preparation: bridgeError comes with bridgePending.
  it("shows a failed preparation with Retry while the bridge keeps retrying it", () => {
    mockAccount = makeStacksAccount({}, [makeStakingPosition()]);
    bridgeState.bridgeError = new Error("preparation failed");
    bridgeState.bridgePending = true;
    renderScreen();

    expect(screen.getByText("preparation failed")).toBeVisible();
    const retry = screen.getByTestId("stacks-unstake-retry");
    expect(retry).toBeEnabled();

    fireEvent.press(retry);

    // In flight until that error clears or is replaced, without the failure it's retrying.
    expect(screen.getByTestId("stacks-unstake-retry")).toBeDisabled();
    expect(screen.queryByText("preparation failed")).toBeNull();
  });

  it("explains there is nothing to unstake without a position", () => {
    mockAccount = makeStacksAccount();
    renderScreen();

    expect(screen.getByTestId("stacks-unstake-no-position")).toBeVisible();
    expect(screen.queryByTestId("stacks-unstake-summary-continue")).toBeNull();
  });
});
