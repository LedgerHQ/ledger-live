import { CommonActions } from "@react-navigation/native";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { NavigatorName, ScreenName } from "~/const";
import { syncTransactionToAmountStep } from "./syncTransactionToAmountStep";

const transaction = { family: "ripple", tag: 123 } as unknown as Transaction;

const makeNavigation = (amountStep: { name: string; key?: string } | null) => {
  const dispatch = jest.fn();
  const sendFundsRoutes = [
    ...(amountStep ? [amountStep] : []),
    { name: ScreenName.SendSummary, key: "summary-key" },
  ];
  return {
    dispatch,
    getState: () => ({
      routes: [
        {
          name: NavigatorName.SendFunds,
          state: { key: "sendfunds-navigator-key", routes: sendFundsRoutes },
        },
        { name: ScreenName.XrpEditTag, key: "edit-key" },
      ],
    }),
  };
};

describe("syncTransactionToAmountStep", () => {
  it("dispatches setParams targeted at the nested amount route (LIVE-35403)", () => {
    const navigation = makeNavigation({ name: ScreenName.SendAmountCoin, key: "amount-key" });

    syncTransactionToAmountStep(navigation, transaction);

    expect(navigation.dispatch).toHaveBeenCalledTimes(1);
    expect(navigation.dispatch).toHaveBeenCalledWith({
      ...CommonActions.setParams({ transaction }),
      source: "amount-key",
      target: "sendfunds-navigator-key",
    });
  });

  it("no-ops when the amount step isn't in the stack (e.g. sign/swap flows)", () => {
    const navigation = makeNavigation(null);

    syncTransactionToAmountStep(navigation, transaction);

    expect(navigation.dispatch).not.toHaveBeenCalled();
  });
});
