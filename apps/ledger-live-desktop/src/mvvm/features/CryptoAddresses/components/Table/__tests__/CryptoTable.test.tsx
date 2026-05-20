import React from "react";
import BigNumber from "bignumber.js";
import { within } from "@testing-library/react";
import { render, screen } from "tests/testSetup";
import { CryptoTable } from "../CryptoTable";
import {
  ETH_ACCOUNT,
  ETH_ACCOUNT_2,
  ETH_ACCOUNT_WITH_USDC,
} from "LLD/features/__mocks__/accounts.mock";
import { aggregatedAssetsFlags } from "../../../testUtils/aggregatedAssetsFlags";
import { createWalletState } from "../../../testUtils/createWalletState";
import {
  buildMainAccountByIdMap,
  lookupParentAccountFromMap,
} from "@ledgerhq/asset-aggregation/assetDistribution/index";

function expectColumnHeaders(options?: { withAssetColumn?: boolean }): void {
  expect(screen.getByRole("columnheader", { name: "Name" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "Address" })).toBeVisible();
  if (options?.withAssetColumn) {
    expect(screen.getByRole("columnheader", { name: "Asset" })).toBeVisible();
  } else {
    expect(screen.queryByRole("columnheader", { name: "Asset" })).not.toBeInTheDocument();
  }
  expect(screen.getByRole("columnheader", { name: "Value" })).toBeVisible();
}

/** Data rows only (exclude header row, which contains columnheaders). */
function dataRowsInTable(): HTMLElement[] {
  return screen
    .getAllByRole("row")
    .filter(row => within(row).queryAllByRole("columnheader").length === 0);
}

function elementPrecedesInDocumentOrder(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("CryptoTable", () => {
  const mockOnRowClick = jest.fn();
  const mockLookupParent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders column headers and no body rows when rows is empty", () => {
    render(
      <CryptoTable rows={[]} lookupParentAccount={mockLookupParent} onRowClick={mockOnRowClick} />,
    );

    expectColumnHeaders();
    expect(dataRowsInTable()).toHaveLength(0);
  });

  it("sorts rows by address when the Address header sort control is activated", async () => {
    const accountHighBalance = {
      ...ETH_ACCOUNT,
      freshAddress: "0xffffffffffffffffffffffffffffffffffffffff",
      balance: new BigNumber("1000000"),
    };
    const accountLowBalance = {
      ...ETH_ACCOUNT_2,
      freshAddress: "0x0000000000000000000000000000000000000001",
      balance: new BigNumber("1"),
    };

    const { user } = render(
      <CryptoTable
        rows={[accountHighBalance, accountLowBalance]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(
          new Map([
            [accountHighBalance.id, "High balance row"],
            [accountLowBalance.id, "Low balance row"],
          ]),
        ),
      },
    );

    const highRow = screen.getByTestId("crypto-account-row-High-balance-row");
    const lowRow = screen.getByTestId("crypto-account-row-Low-balance-row");

    expect(elementPrecedesInDocumentOrder(highRow, lowRow)).toBe(true);

    await user.click(
      within(screen.getByRole("columnheader", { name: "Address" })).getByRole("button"),
    );

    expect(elementPrecedesInDocumentOrder(lowRow, highRow)).toBe(true);
  });

  it("renders one account row with expected cells and calls onRowClick when the name control is used", async () => {
    const accountLabel = "Ethereum main";

    const { user } = render(
      <CryptoTable
        rows={[ETH_ACCOUNT]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(new Map([[ETH_ACCOUNT.id, accountLabel]])),
      },
    );

    expectColumnHeaders();
    expect(screen.getByText(accountLabel)).toBeVisible();
    expect(screen.getByText("ETH")).toBeVisible();
    expect(screen.queryByTestId("account-assets-cell")).not.toBeInTheDocument();
    const table = screen.getByRole("table");
    const tbodyElements = within(table)
      .getAllByRole("rowgroup")
      .filter((el): el is HTMLElement => el.tagName === "TBODY");
    expect(tbodyElements).toHaveLength(1);
    const dataCells = within(tbodyElements[0]).getAllByRole("cell");
    expect(dataCells).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: new RegExp(accountLabel) }));

    expect(mockOnRowClick).toHaveBeenCalledTimes(1);
    expect(mockOnRowClick).toHaveBeenCalledWith(ETH_ACCOUNT, undefined);
  });

  it("renders the asset column when shouldDisplayAggregatedAssets is enabled", () => {
    render(
      <CryptoTable
        rows={[ETH_ACCOUNT]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: {
          ...aggregatedAssetsFlags,
          ...createWalletState(new Map([[ETH_ACCOUNT.id, "Ethereum main"]])),
        },
      },
    );

    expectColumnHeaders({ withAssetColumn: true });
    expect(screen.getByTestId("account-assets-cell")).toBeVisible();
  });

  it("on token rows: ignores row click for edit name; row click passes token and parent", async () => {
    const parentAccount = ETH_ACCOUNT_WITH_USDC;
    const tokenAccount = parentAccount.subAccounts![0];

    const mainById = buildMainAccountByIdMap([parentAccount]);
    mockLookupParent.mockImplementation(id => lookupParentAccountFromMap(mainById, id));

    const { user } = render(
      <CryptoTable
        rows={[tokenAccount]}
        lookupParentAccount={mockLookupParent}
        onRowClick={mockOnRowClick}
      />,
      {
        initialState: createWalletState(
          new Map([
            [parentAccount.id, "Parent"],
            [tokenAccount.id, "USDT on Eth"],
          ]),
        ),
      },
    );

    await user.click(screen.getByRole("button", { name: "Edit name" }));
    expect(mockOnRowClick).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /USDT on Eth/ }));
    expect(mockOnRowClick).toHaveBeenCalledTimes(1);
    expect(mockOnRowClick).toHaveBeenCalledWith(tokenAccount, parentAccount);
  });
});
