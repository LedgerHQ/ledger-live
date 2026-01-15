import BigNumber from "bignumber.js";
import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { render, screen } from "@tests/test-renderer";
import AccountsListView from ".";
import { Text } from "@ledgerhq/native-ui";

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculate: ({ value }: { value: number }) => value,
}));

describe("AccountsListView", () => {
  it("renders a list of accounts", () => {
    render(<AccountsListView specificAccounts={mockedAccounts} />);

    expect(screen.getByTestId("account-item-1-name")).toBeVisible();
    expect(screen.getByText("0x12...cdef")).toBeVisible();
    expect(screen.getByText("$1,234,567.89")).toBeVisible();

    expect(screen.getByTestId("account-item-2-name")).toBeVisible();
    expect(screen.getByText("0xab...4321")).toBeVisible();
    expect(screen.getByText("$9,876,543.21")).toBeVisible();
  });

  it("limits the amount of visible accounts", () => {
    render(<AccountsListView specificAccounts={mockedAccounts} limitNumberOfAccounts={1} />);

    expect(screen.getByText("0x12...cdef")).toBeVisible();
    expect(screen.queryByText("0xab...4321")).toBeNull();
  });

  it("renders the children prop at the end of the list", () => {
    render(
      <AccountsListView
        specificAccounts={mockedAccounts}
        limitNumberOfAccounts={1}
        ListFooterComponent={<Text>Last element</Text>}
      />,
    );
    const items = screen.getAllByText(/Last element|0x\w+\.\.\.\w+/);
    expect(items).toHaveLength(2);
    expect(items[0]).toBe(screen.getByText("0x12...cdef"));
    expect(items[1]).toBe(screen.getByText("Last element"));
  });
});

const units = [] as CryptoCurrency["units"];
const mockedCurrency = { type: "CryptoCurrency", units, ticker: "BTC" } as CryptoCurrency;
const mockedAccounts = [
  {
    type: "Account",
    id: "1",
    freshAddress: "0x1234567890abcdef",
    balance: BigNumber("123456789"),
    currency: mockedCurrency,
  },
  {
    type: "Account",
    id: "2",
    freshAddress: "0xabcdef0987654321",
    balance: BigNumber("987654321"),
    currency: mockedCurrency,
  },
] as Account[];
