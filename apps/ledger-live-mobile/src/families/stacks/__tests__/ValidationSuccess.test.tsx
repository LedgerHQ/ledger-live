import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import type { Operation } from "@ledgerhq/types-live";
import { track } from "@shared/analytics";
import { ScreenName } from "~/const";
import StacksValidationSuccess from "../shared/ValidationSuccess";
import { makeStacksAccount, POOL_ADDRESS } from "../__mocks__/account.mock";
import { mockBridge } from "../__mocks__/bridge.mock";

const mockAccount = makeStacksAccount();

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: mockAccount, parentAccount: undefined }),
}));

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));

const result = { id: "op-1" } as Operation;
const navigation = { pop: jest.fn(), navigate: jest.fn() };

const renderScreen = (variant: "stake" | "unstake") =>
  render(
    <StacksValidationSuccess
      navigation={navigation as never}
      route={{
        params: {
          accountId: mockAccount.id,
          transaction: { ...mockBridge.createTransaction(), valAddress: POOL_ADDRESS },
          result,
          source: { name: ScreenName.Account } as never,
        },
      }}
      variant={variant}
    />,
  );

describe("Stacks ValidationSuccess", () => {
  beforeEach(() => {
    jest.mocked(track).mockClear();
    navigation.pop.mockReset();
    navigation.navigate.mockReset();
  });

  it.each([
    ["stake", "staking_completed", "delegation", "You have successfully staked your assets"],
    ["unstake", "undelegation_completed", "undelegation", "Unstake submitted"],
  ] as const)("tracks and titles the %s variant", (variant, event, delegation, title) => {
    renderScreen(variant);

    expect(screen.getByText(title)).toBeVisible();
    expect(track).toHaveBeenCalledWith(event, {
      currency: "STX",
      validator: POOL_ADDRESS,
      source: ScreenName.Account,
      delegation,
      flow: "stake",
    });
  });

  it("closes the flow and opens the operation details", () => {
    renderScreen("stake");

    fireEvent.press(screen.getByText("View details"));
    expect(navigation.navigate).toHaveBeenCalledWith(ScreenName.OperationDetails, {
      accountId: mockAccount.id,
      operation: result,
    });

    fireEvent.press(screen.getByText("Close"));
    expect(navigation.pop).toHaveBeenCalled();
  });
});
