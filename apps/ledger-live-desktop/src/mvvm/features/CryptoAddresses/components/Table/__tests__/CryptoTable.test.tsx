import React from "react";
import { within } from "@testing-library/react";
import { render, screen } from "tests/testSetup";
import { CryptoTable } from "../CryptoTable";
import { ETH_ACCOUNT, ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import { createWalletState } from "../../../testUtils/createWalletState";

jest.mock("LLD/features/Assets/components/Cells/CounterValueCell", () => ({
  CounterValueCell: () => <span data-testid="counter-value-cell">$0.00</span>,
}));

function expectColumnHeaders(): void {
  expect(screen.getByRole("columnheader", { name: "Name" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "Address" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "Value" })).toBeVisible();
}

function tbodyRows(): HTMLElement[] {
  const table = screen.getByRole("table");
  const tbody = within(table)
    .getAllByRole("rowgroup")
    .find(el => el.tagName === "TBODY");
  return tbody ? within(tbody).queryAllByRole("row", { hidden: true }) : [];
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
    expect(tbodyRows()).toHaveLength(0);
  });

  it("renders column headers, account name, ticker, and value cell per row", () => {
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

    expectColumnHeaders();
    expect(screen.getByText("Ethereum main")).toBeVisible();
    expect(screen.getByText("ETH")).toBeVisible();
    expect(screen.getByTestId("counter-value-cell")).toBeVisible();
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

  it("on token rows: ignores row click for edit name; row click passes token and parent", async () => {
    const parentAccount = ETH_ACCOUNT_WITH_USDC;
    const tokenAccount = parentAccount.subAccounts![0];

    mockLookupParent.mockImplementation((id: string) =>
      id === parentAccount.id ? parentAccount : undefined,
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
