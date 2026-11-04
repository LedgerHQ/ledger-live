import React from "react";
import BigNumber from "bignumber.js";
import { act, within } from "@testing-library/react";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { CryptoTable } from "../CryptoTable";
import {
  ETH_ACCOUNT,
  ETH_ACCOUNT_2,
  ETH_ACCOUNT_WITH_USDC,
} from "LLD/features/__mocks__/accounts.mock";
import { createWalletState } from "../../../testUtils/createWalletState";
import { setAccountName } from "~/renderer/reducers/wallet";
import { setLastUserSyncClickTimestamp } from "~/renderer/reducers/syncRefresh";
import {
  buildMainAccountByIdMap,
  lookupParentAccountFromMap,
} from "@ledgerhq/asset-aggregation/assetDistribution/index";

function expectColumnHeaders(): void {
  expect(screen.getByRole("columnheader", { name: "Name" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "Address" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "Asset" })).toBeVisible();
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
    expect(screen.getByLabelText("ETH")).toBeVisible();
    expect(screen.getByTestId("account-assets-cell")).toBeVisible();
    const table = screen.getByRole("table");
    const tbodyElements = within(table)
      .getAllByRole("rowgroup")
      .filter((el): el is HTMLElement => el.tagName === "TBODY");
    expect(tbodyElements).toHaveLength(1);
    const dataCells = within(tbodyElements[0]).getAllByRole("cell");
    expect(dataCells).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: new RegExp(accountLabel) }));

    expect(mockOnRowClick).toHaveBeenCalledTimes(1);
    expect(mockOnRowClick).toHaveBeenCalledWith(ETH_ACCOUNT, undefined);
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
    expect(await screen.findByTestId("edit-crypto-address-name-dialog-content")).toBeVisible();
    expect(mockOnRowClick).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        screen.queryByTestId("edit-crypto-address-name-dialog-content"),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /USDT on Eth/ }));
    expect(mockOnRowClick).toHaveBeenCalledTimes(1);
    expect(mockOnRowClick).toHaveBeenCalledWith(tokenAccount, parentAccount);
  });

  describe("account settings", () => {
    const SETTINGS_DIALOG_TEST_ID = "crypto-addresses-account-settings-dialog";

    const renderWithAccountDetail = (
      rows: Parameters<typeof CryptoTable>[0]["rows"],
      accountDetail: { enabled: boolean; params?: { excludedCurrencyIds: string[] } },
      names: Map<string, string>,
    ) =>
      render(
        <CryptoTable
          rows={rows}
          lookupParentAccount={mockLookupParent}
          onRowClick={mockOnRowClick}
        />,
        {
          initialState: {
            ...withFlagOverrides({ accountDetail }),
            ...createWalletState(names),
          },
        },
      );

    it("opens the account settings of the row instead of the edit name dialog", async () => {
      const { user } = renderWithAccountDetail(
        [ETH_ACCOUNT, ETH_ACCOUNT_2],
        { enabled: true },
        new Map([
          [ETH_ACCOUNT.id, "Main"],
          [ETH_ACCOUNT_2.id, "Secondary"],
        ]),
      );

      const mainRow = screen.getByTestId("crypto-account-row-Main");
      expect(within(mainRow).queryByRole("button", { name: "Edit name" })).not.toBeInTheDocument();
      await user.click(within(mainRow).getByRole("button", { name: "Account settings" }));

      const dialog = await screen.findByTestId(SETTINGS_DIALOG_TEST_ID);
      expect(within(dialog).getByText("Main")).toBeVisible();
      expect(within(dialog).getByText("View advanced logs")).toBeVisible();
      expect(mockOnRowClick).not.toHaveBeenCalled();
    });

    it("renames the account from the settings dialog", async () => {
      const { user } = renderWithAccountDetail(
        [ETH_ACCOUNT],
        { enabled: true },
        new Map([[ETH_ACCOUNT.id, "Main"]]),
      );

      await user.click(screen.getByRole("button", { name: "Account settings" }));
      await user.click(await screen.findByTestId("account-settings-change-name"));
      const input = await screen.findByLabelText("Address name");
      await user.clear(input);
      await user.type(input, "Savings{Enter}");

      expect(await screen.findByTestId("crypto-account-row-Savings")).toBeVisible();
    });

    it("keeps the edit name button for an excluded currency", () => {
      renderWithAccountDetail(
        [ETH_ACCOUNT],
        { enabled: true, params: { excludedCurrencyIds: ["ethereum"] } },
        new Map([[ETH_ACCOUNT.id, "Main"]]),
      );

      expect(screen.getByRole("button", { name: "Edit name" })).toBeVisible();
      expect(screen.queryByRole("button", { name: "Account settings" })).not.toBeInTheDocument();
    });

    it("keeps the edit name button for token rows", () => {
      const tokenAccount = ETH_ACCOUNT_WITH_USDC.subAccounts![0];
      const mainById = buildMainAccountByIdMap([ETH_ACCOUNT_WITH_USDC]);
      mockLookupParent.mockImplementation(id => lookupParentAccountFromMap(mainById, id));

      renderWithAccountDetail(
        [tokenAccount],
        { enabled: true },
        new Map([
          [ETH_ACCOUNT_WITH_USDC.id, "Parent"],
          [tokenAccount.id, "USDC on Eth"],
        ]),
      );

      expect(screen.getByRole("button", { name: "Edit name" })).toBeVisible();
      expect(screen.queryByRole("button", { name: "Account settings" })).not.toBeInTheDocument();
    });

    it("keeps the edit name button when the flag is off", () => {
      renderWithAccountDetail(
        [ETH_ACCOUNT],
        { enabled: false },
        new Map([[ETH_ACCOUNT.id, "Main"]]),
      );

      expect(screen.getByRole("button", { name: "Edit name" })).toBeVisible();
      expect(screen.queryByRole("button", { name: "Account settings" })).not.toBeInTheDocument();
    });
  });

  describe("edit name dialog", () => {
    const DIALOG_TEST_ID = "edit-crypto-address-name-dialog-content";
    const TYPED_NAME = "Long term savings";

    const renderAndStartEditing = async () => {
      const rendered = render(
        <CryptoTable
          rows={[ETH_ACCOUNT, ETH_ACCOUNT_2]}
          lookupParentAccount={mockLookupParent}
          onRowClick={mockOnRowClick}
        />,
        {
          initialState: createWalletState(
            new Map([
              [ETH_ACCOUNT.id, "Main"],
              [ETH_ACCOUNT_2.id, "Secondary"],
            ]),
          ),
        },
      );

      const mainRow = screen.getByTestId("crypto-account-row-Main");
      await rendered.user.click(within(mainRow).getByRole("button", { name: "Edit name" }));
      const input = await screen.findByLabelText("Address name");
      await rendered.user.clear(input);
      await rendered.user.type(input, TYPED_NAME);

      return rendered;
    };

    it("stays open when another account is renamed", async () => {
      const { store } = await renderAndStartEditing();

      act(() => {
        store.dispatch(setAccountName(ETH_ACCOUNT_2.id, "Renamed elsewhere"));
      });

      expect(screen.getByTestId(DIALOG_TEST_ID)).toBeVisible();
      expect(screen.getByLabelText("Address name")).toHaveValue(TYPED_NAME);
    });

    it("stays open when a sync refreshes the accounts", async () => {
      const { rerender } = await renderAndStartEditing();

      rerender(
        <CryptoTable
          rows={[
            { ...ETH_ACCOUNT, balance: new BigNumber("42") },
            { ...ETH_ACCOUNT_2, balance: new BigNumber("7") },
          ]}
          lookupParentAccount={mockLookupParent}
          onRowClick={mockOnRowClick}
        />,
      );

      expect(screen.getByTestId(DIALOG_TEST_ID)).toBeVisible();
      expect(screen.getByLabelText("Address name")).toHaveValue(TYPED_NAME);
    });

    it("stays open and blocks saving when the user starts a sync", async () => {
      const { store } = await renderAndStartEditing();

      act(() => {
        store.dispatch(setLastUserSyncClickTimestamp(Date.now()));
      });

      expect(screen.getByTestId(DIALOG_TEST_ID)).toBeVisible();
      expect(screen.getByLabelText("Address name")).toHaveValue(TYPED_NAME);
      expect(screen.getByTestId("edit-crypto-address-name-dialog-cta")).toBeDisabled();
    });

    it("returns focus to the edit button when closed with Escape", async () => {
      const { user } = await renderAndStartEditing();

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByTestId(DIALOG_TEST_ID)).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(
          within(screen.getByTestId("crypto-account-row-Main")).getByRole("button", {
            name: "Edit name",
          }),
        ).toHaveFocus();
      });
    });

    it("returns focus to the edit button after saving", async () => {
      const { user } = await renderAndStartEditing();

      await user.click(screen.getByTestId("edit-crypto-address-name-dialog-cta"));

      await waitFor(() => {
        expect(screen.queryByTestId(DIALOG_TEST_ID)).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(
          within(
            screen.getByTestId(`crypto-account-row-${TYPED_NAME.replaceAll(" ", "-")}`),
          ).getByRole("button", { name: "Edit name" }),
        ).toHaveFocus();
      });
    });
  });
});
