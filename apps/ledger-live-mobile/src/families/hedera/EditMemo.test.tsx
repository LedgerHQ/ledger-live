import React from "react";
import BigNumber from "bignumber.js";
import type { HederaGenericTransaction } from "@ledgerhq/live-common/families/hedera/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { popToScreen } from "~/helpers/navigationHelpers";
import { component as HederaEditMemo } from "./EditMemo";
import { makeHederaAccount } from "./__mocks__/account.mock";

const mockUpdateTransaction = jest.fn((tx: object, patch: object) => ({ ...tx, ...patch }));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ updateTransaction: mockUpdateTransaction }),
}));

jest.mock("~/helpers/navigationHelpers", () => ({
  popToScreen: jest.fn(),
}));

const account = makeHederaAccount();
const navigation = { navigate: jest.fn() };

const baseTx: HederaGenericTransaction = {
  family: "hedera",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
};

function renderScreen(transaction: HederaGenericTransaction) {
  render(
    <HederaEditMemo
      navigation={navigation as never}
      route={{ params: { account, transaction } } as never}
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("HederaEditMemo", () => {
  it("should prefill the input when the transaction has a memo", () => {
    renderScreen({ ...baseTx, memoValue: "ref-1" });

    expect(screen.getByDisplayValue("ref-1")).toBeVisible();
  });

  it("should write the typed memo to the generic memo fields when validated", () => {
    renderScreen(baseTx);

    fireEvent.changeText(screen.getByDisplayValue(""), "ref-42");
    fireEvent.press(screen.getByText("Validate memo"));

    expect(mockUpdateTransaction).toHaveBeenCalledWith(baseTx, {
      memoType: "string",
      memoValue: "ref-42",
    });
    expect(popToScreen).toHaveBeenCalledWith(
      navigation,
      ScreenName.SendSummary,
      expect.objectContaining({ accountId: account.id }),
    );
  });

  it("should clear the memo value when the input is emptied", () => {
    const tx = { ...baseTx, memoValue: "ref-1" };
    renderScreen(tx);

    fireEvent.changeText(screen.getByDisplayValue("ref-1"), "");
    fireEvent.press(screen.getByText("Validate memo"));

    expect(mockUpdateTransaction).toHaveBeenCalledWith(tx, {
      memoType: "string",
      memoValue: undefined,
    });
  });
});
