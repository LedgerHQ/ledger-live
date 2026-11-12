import React from "react";
import BigNumber from "bignumber.js";
import { fireEvent, screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import { ScreenName } from "~/const";
import { popToScreen } from "~/helpers/navigationHelpers";
import { component as CosmosFamilyEditMemo } from "../EditMemo";

const mockUpdateTransaction = jest.fn((transaction: Transaction, patch: Partial<Transaction>) => ({
  ...transaction,
  ...patch,
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ updateTransaction: mockUpdateTransaction }),
}));
jest.mock("~/helpers/navigationHelpers", () => ({
  ...jest.requireActual("~/helpers/navigationHelpers"),
  popToScreen: jest.fn(),
}));

const mockPopToScreen = jest.mocked(popToScreen);

const account = {
  id: "cosmos-account",
  currency: getCryptoCurrencyById("cosmos"),
};

const makeTransaction = (patch: Partial<Transaction> = {}) =>
  ({
    family: "cosmos",
    mode: "send",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    ...patch,
  }) as Transaction;

const renderScreen = (transaction: Transaction) => {
  const navigation = {};
  const route = { params: { account, transaction } };
  return {
    navigation,
    route,
    ...render(<CosmosFamilyEditMemo navigation={navigation as never} route={route as never} />),
  };
};

describe("cosmos EditMemo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefills the input with the memoValue of the transaction", () => {
    renderScreen(makeTransaction({ memoType: "text", memoValue: "existing memo" }));

    expect(screen.getByDisplayValue("existing memo")).toBeOnTheScreen();
  });

  it("starts with an empty input when the transaction has no memoValue", () => {
    renderScreen(makeTransaction({ memoType: null, memoValue: null }));

    expect(screen.getByDisplayValue("")).toBeOnTheScreen();
  });

  it("writes the typed memo to memoType and memoValue when validating", () => {
    const transaction = makeTransaction();
    const { navigation, route } = renderScreen(transaction);

    fireEvent.changeText(screen.getByDisplayValue(""), "invoice 42");
    fireEvent.press(screen.getByText("Validate memo"));

    expect(mockUpdateTransaction).toHaveBeenCalledWith(transaction, {
      memoType: "text",
      memoValue: "invoice 42",
    });
    expect(mockPopToScreen).toHaveBeenCalledWith(
      navigation,
      ScreenName.SendSummary,
      expect.objectContaining({
        ...route.params,
        accountId: "cosmos-account",
        transaction: expect.objectContaining({ memoType: "text", memoValue: "invoice 42" }),
      }),
    );
  });

  it("validates when the keyboard submit key is pressed", () => {
    renderScreen(makeTransaction({ memoType: "text", memoValue: "from keyboard" }));

    fireEvent(screen.getByDisplayValue("from keyboard"), "submitEditing");

    expect(mockPopToScreen).toHaveBeenCalledTimes(1);
  });

  it("clears the memo fields when the input is emptied", () => {
    renderScreen(makeTransaction({ memoType: "text", memoValue: "to clear" }));

    fireEvent.changeText(screen.getByDisplayValue("to clear"), "");
    fireEvent.press(screen.getByText("Validate memo"));

    expect(mockUpdateTransaction).toHaveBeenCalledWith(expect.anything(), {
      memoType: null,
      memoValue: undefined,
    });
  });
});
