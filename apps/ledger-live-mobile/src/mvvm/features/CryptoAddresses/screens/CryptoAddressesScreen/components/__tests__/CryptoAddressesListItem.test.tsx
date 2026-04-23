import React from "react";
import { render, screen, fireEvent } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import CryptoAddressesListItem from "../CryptoAddressesListItem";

jest.mock("LLM/features/Accounts/components/AccountItem", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ account }: { account: Account }) => (
      <Text testID="account-item">{account.currency.name}</Text>
    ),
  };
});

const units = [] as CryptoCurrency["units"];
const mockCurrency = {
  type: "CryptoCurrency",
  units,
  ticker: "BTC",
  name: "Bitcoin",
} as CryptoCurrency;

const mockAccount = {
  type: "Account",
  id: "account-1",
  freshAddress: "0x123",
  balance: BigNumber("100"),
  currency: mockCurrency,
} as Account;

describe("CryptoAddressesListItem", () => {
  it("should render the account and call onPress with it when pressed", () => {
    const onPress = jest.fn();
    render(
      <CryptoAddressesListItem
        account={mockAccount}
        aggregatedCountervalue={new BigNumber(1000)}
        subAccountsCount={0}
        onPress={onPress}
      />,
    );

    expect(screen.getByText("Bitcoin")).toBeVisible();

    fireEvent.press(screen.getByText("Bitcoin"));
    expect(onPress).toHaveBeenCalledWith(mockAccount);
  });

  it("should always show the assets count", () => {
    const onPress = jest.fn();
    render(
      <CryptoAddressesListItem
        account={mockAccount}
        aggregatedCountervalue={new BigNumber(1000)}
        subAccountsCount={0}
        onPress={onPress}
      />,
    );

    expect(screen.getByTestId("assets-count")).toBeVisible();
  });

  it("should count the main account itself as 1 asset when there are no sub-accounts", () => {
    const onPress = jest.fn();
    render(
      <CryptoAddressesListItem
        account={mockAccount}
        aggregatedCountervalue={new BigNumber(1000)}
        subAccountsCount={0}
        onPress={onPress}
      />,
    );

    expect(screen.getByTestId("assets-count")).toHaveTextContent("1");
  });

  it("should count main account + sub-accounts", () => {
    const onPress = jest.fn();
    render(
      <CryptoAddressesListItem
        account={mockAccount}
        aggregatedCountervalue={new BigNumber(1000)}
        subAccountsCount={3}
        onPress={onPress}
      />,
    );

    expect(screen.getByTestId("assets-count")).toHaveTextContent("4");
  });
});
