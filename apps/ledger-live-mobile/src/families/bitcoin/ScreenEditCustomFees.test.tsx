import React from "react";
import { ScrollView } from "react-native";
import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import {
  bitcoinPickingStrategy,
  type Transaction as BitcoinTransaction,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { NavigatorName, ScreenName } from "~/const";
import { component as BitcoinEditCustomFees } from "./ScreenEditCustomFees";

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
}));

jest.mock("~/components/NavigationScrollView", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <ScrollView>{children}</ScrollView>,
}));

const account = genAccount("bitcoin-custom-fees", {
  currency: getCryptoCurrencyById("bitcoin"),
});

const utxoStrategy = { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] };

const transaction: BitcoinTransaction = {
  family: "bitcoin",
  amount: new BigNumber(1000),
  recipient: "bc1qrecipient",
  feesStrategy: "medium",
  familySpecificData: { utxoStrategy, opReturnData: "6c6c" },
  feeParameters: { feePerByte: "3", relayFeePerByte: "2" },
};

const mockUpdateTransaction = jest.fn(
  (tx: BitcoinTransaction, patch: Partial<BitcoinTransaction>) => ({ ...tx, ...patch }),
);

function renderScreen() {
  const navigation = { popTo: jest.fn() };
  const route = {
    params: {
      accountId: account.id,
      transaction,
      currentNavigation: ScreenName.SignTransactionSummary,
      nextNavigation: ScreenName.SignTransactionSelectDevice,
      satPerByte: new BigNumber(5),
    },
  };
  render(<BitcoinEditCustomFees navigation={navigation as never} route={route as never} />);
  return { navigation, route };
}

describe("BitcoinEditCustomFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAccountScreen).mockReturnValue({ account, parentAccount: undefined });
    jest.mocked(useAccountBridge).mockReturnValue({
      updateTransaction: mockUpdateTransaction,
    } as never);
  });

  it("should set the custom rate in familySpecificData and keep the other user choices when validated", () => {
    const { navigation, route } = renderScreen();

    const input = screen.getByDisplayValue("5");
    fireEvent.changeText(input, "012");
    fireEvent(input, "submitEditing");

    const patch = {
      feesStrategy: "custom",
      familySpecificData: { utxoStrategy, opReturnData: "6c6c", feePerByte: "12" },
    };
    expect(mockUpdateTransaction).toHaveBeenCalledWith(transaction, patch);
    expect(navigation.popTo).toHaveBeenCalledWith(NavigatorName.SignTransaction, {
      screen: ScreenName.SignTransactionSummary,
      params: { ...route.params, accountId: account.id, transaction: { ...transaction, ...patch } },
    });
  });

  it("should reject a rate below the relay fee of the last estimation", () => {
    const { navigation } = renderScreen();

    const input = screen.getByDisplayValue("5");
    fireEvent.changeText(input, "1");
    fireEvent(input, "submitEditing");

    expect(
      screen.getByText("Fees are too low to be accepted by the network. Please increase them"),
    ).toBeVisible();
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
    expect(navigation.popTo).not.toHaveBeenCalled();
  });

  it("should accept a rate equal to the relay fee of the last estimation", () => {
    renderScreen();

    fireEvent.changeText(screen.getByDisplayValue("5"), "2");

    expect(
      screen.queryByText("Fees are too low to be accepted by the network. Please increase them"),
    ).not.toBeOnTheScreen();
  });
});
