import React from "react";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { WalletState } from "@ledgerhq/live-wallet/store";
import { render, screen } from "tests/testSetup";
import { CryptosTable } from "../CryptosTable";

jest.mock("LLD/features/Assets/components/Cells/CounterValueCell", () => ({
  CounterValueCell: () => <span data-testid="counter-value-cell">$0.00</span>,
}));

jest.mock("~/renderer/components/CryptoCurrencyIcon", () => ({
  __esModule: true,
  default: () => <span data-testid="crypto-currency-icon" />,
}));

const ethereumCurrency = getCryptoCurrencyById("ethereum");

function createWalletState(accountNames: Map<string, string>): { wallet: WalletState } {
  return {
    wallet: {
      accountNames,
      starredAccountIds: new Set(),
      nonImportedAccountInfos: [],
      walletSyncState: { data: null, version: 0 },
      recentAddresses: {},
    },
  };
}

describe("CryptosTable", () => {
  const mockOnRowClick = jest.fn();
  const mockLookupParent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders column headers", () => {
    const account = genAccount("cryptos-table-btc", {
      currency: getCryptoCurrencyById("bitcoin"),
      operationsSize: 0,
    });

    render(
      <CryptosTable
        rows={[account]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(new Map([[account.id, "My BTC"]])),
      },
    );

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Address" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Value" })).toBeInTheDocument();
  });

  it("renders no data rows when rows is empty", () => {
    render(
      <CryptosTable rows={[]} lookupParentAccount={mockLookupParent} onRowClick={mockOnRowClick} />,
    );

    const bodyRows = screen.queryAllByRole("row", { hidden: true }).filter(row => {
      const table = row.closest("table");
      return table && row.parentElement?.tagName === "TBODY";
    });
    expect(bodyRows).toHaveLength(0);
  });

  it("renders account name and value cell per row", () => {
    const account = genAccount("cryptos-table-eth", {
      currency: ethereumCurrency,
      operationsSize: 0,
    });

    render(
      <CryptosTable
        rows={[account]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(new Map([[account.id, "Ethereum main"]])),
      },
    );

    expect(screen.getByText("Ethereum main")).toBeVisible();
    expect(screen.getByTestId("counter-value-cell")).toBeInTheDocument();
    expect(screen.getByTestId("crypto-currency-icon")).toBeInTheDocument();
  });

  it("calls onRowClick with account when a data row is clicked", async () => {
    const account = genAccount("cryptos-table-row-click", {
      currency: ethereumCurrency,
      operationsSize: 0,
    });

    const { user } = render(
      <CryptosTable
        rows={[account]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(new Map([[account.id, "Row click account"]])),
      },
    );

    await user.click(screen.getByRole("button", { name: /Row click account/ }));

    expect(mockOnRowClick).toHaveBeenCalledTimes(1);
    expect(mockOnRowClick).toHaveBeenCalledWith(account, undefined);
  });

  it("does not call onRowClick when edit name button is clicked", async () => {
    const parentAccount = genAccount("cryptos-table-parent", {
      currency: ethereumCurrency,
      operationsSize: 0,
    });
    const tokenAccount = genTokenAccount(0, parentAccount, usdcToken);

    mockLookupParent.mockImplementation((id: string) =>
      id === parentAccount.id ? parentAccount : undefined,
    );

    const { user } = render(
      <CryptosTable
        rows={[tokenAccount]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(
          new Map([
            [parentAccount.id, "Parent"],
            [tokenAccount.id, "USDT token"],
          ]),
        ),
      },
    );

    await user.click(screen.getByRole("button", { name: "Edit name" }));

    expect(mockOnRowClick).not.toHaveBeenCalled();
  });

  it("calls onRowClick with token account and parent when row is clicked", async () => {
    const parentAccount = genAccount("cryptos-table-parent-row", {
      currency: ethereumCurrency,
      operationsSize: 0,
    });
    const tokenAccount = genTokenAccount(0, parentAccount, usdcToken);

    mockLookupParent.mockImplementation((id: string) =>
      id === parentAccount.id ? parentAccount : undefined,
    );

    const { user } = render(
      <CryptosTable
        rows={[tokenAccount]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(new Map([[tokenAccount.id, "USDT on Eth"]])),
      },
    );

    await user.click(screen.getByRole("button", { name: /USDT on Eth/ }));

    expect(mockOnRowClick).toHaveBeenCalledTimes(1);
    expect(mockOnRowClick).toHaveBeenCalledWith(tokenAccount, parentAccount);
  });
});
