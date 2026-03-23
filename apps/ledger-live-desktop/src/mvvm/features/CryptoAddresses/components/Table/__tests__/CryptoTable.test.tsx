import React from "react";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { WalletState } from "@ledgerhq/live-wallet/store";
import { render, screen } from "tests/testSetup";
import { CryptoTable } from "../CryptoTable";
import { BTC_ACCOUNT, ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

jest.mock("LLD/features/Assets/components/Cells/CounterValueCell", () => ({
  CounterValueCell: () => <span data-testid="counter-value-cell">$0.00</span>,
}));

jest.mock("~/renderer/components/CryptoCurrencyIcon", () => ({
  __esModule: true,
  default: () => <span data-testid="crypto-currency-icon" />,
}));

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

describe("CryptoTable", () => {
  const mockOnRowClick = jest.fn();
  const mockLookupParent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders column headers", () => {
    render(
      <CryptoTable
        rows={[BTC_ACCOUNT]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(new Map([[BTC_ACCOUNT.id, "My BTC"]])),
      },
    );

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Address" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Value" })).toBeInTheDocument();
  });

  it("renders no data rows when rows is empty", () => {
    render(
      <CryptoTable rows={[]} lookupParentAccount={mockLookupParent} onRowClick={mockOnRowClick} />,
    );

    const bodyRows = screen.queryAllByRole("row", { hidden: true }).filter(row => {
      const table = row.closest("table");
      return table && row.parentElement?.tagName === "TBODY";
    });
    expect(bodyRows).toHaveLength(0);
  });

  it("renders account name and value cell per row", () => {
    render(
      <CryptoTable
        rows={[ETH_ACCOUNT]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(new Map([[ETH_ACCOUNT.id, "Ethereum main"]])),
      },
    );

    expect(screen.getByText("Ethereum main")).toBeVisible();
    expect(screen.getByTestId("counter-value-cell")).toBeInTheDocument();
    expect(screen.getByTestId("crypto-currency-icon")).toBeInTheDocument();
  });

  it("calls onRowClick with account when a data row is clicked", async () => {
    const { user } = render(
      <CryptoTable
        rows={[ETH_ACCOUNT]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(new Map([[ETH_ACCOUNT.id, "Row click account"]])),
      },
    );

    await user.click(screen.getByRole("button", { name: /Row click account/ }));

    expect(mockOnRowClick).toHaveBeenCalledTimes(1);
    expect(mockOnRowClick).toHaveBeenCalledWith(ETH_ACCOUNT, undefined);
  });

  it("does not call onRowClick when edit name button is clicked", async () => {
    const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

    mockLookupParent.mockImplementation((id: string) =>
      id === ETH_ACCOUNT.id ? ETH_ACCOUNT : undefined,
    );

    const { user } = render(
      <CryptoTable
        rows={[tokenAccount]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(
          new Map([
            [ETH_ACCOUNT.id, "Parent"],
            [tokenAccount.id, "USDT token"],
          ]),
        ),
      },
    );

    await user.click(screen.getByRole("button", { name: "Edit name" }));

    expect(mockOnRowClick).not.toHaveBeenCalled();
  });

  it("calls onRowClick with token account and parent when row is clicked", async () => {
    const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

    mockLookupParent.mockImplementation((id: string) =>
      id === ETH_ACCOUNT.id ? ETH_ACCOUNT : undefined,
    );

    const { user } = render(
      <CryptoTable
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
    expect(mockOnRowClick).toHaveBeenCalledWith(tokenAccount, ETH_ACCOUNT);
  });
});
