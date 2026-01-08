import React from "react";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { WalletState } from "@ledgerhq/live-wallet/store";
import { render, screen, waitFor } from "tests/testSetup";
import AccountHeader from "../AccountHeader";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("AccountHeader", () => {
  const currency = getCryptoCurrencyById("bitcoin");
  const mockAccount = genAccount("mock-account-id", {
    currency,
    operationsSize: 0,
  });

  const accountName = "My Bitcoin Account";

  const walletState: WalletState = {
    accountNames: new Map([[mockAccount.id, accountName]]),
    starredAccountIds: new Set(),
    walletSyncState: {
      data: null,
      version: 0,
    },
    nonImportedAccountInfos: [],
    recentAddresses: {},
  };

  const initialState = {
    wallet: walletState,
  };

  test("should select input text when focused", async () => {
    const { user } = render(<AccountHeader account={mockAccount} parentAccount={null} />, {
      initialState,
    });

    const input = screen.getByDisplayValue(accountName);
    expect(input).toBeInTheDocument();

    // Mock the select method
    const selectSpy = jest.fn();
    Object.defineProperty(input, "select", {
      value: selectSpy,
      writable: true,
    });

    // Focus the input
    await user.click(input);

    // Wait for the setTimeout to execute
    await waitFor(() => {
      expect(selectSpy).toHaveBeenCalled();
    });
  });

  test("should not throw error when focusing input (useRef fix)", async () => {
    const { user } = render(<AccountHeader account={mockAccount} parentAccount={null} />, {
      initialState,
    });

    const input = screen.getByDisplayValue(accountName);

    // This should not throw a "Cannot read properties of null" error
    await expect(async () => {
      await user.click(input);
    }).resolves.not.toThrow();
  });

  test("should allow editing account name", async () => {
    const { user } = render(<AccountHeader account={mockAccount} parentAccount={null} />, {
      initialState,
    });

    const input = screen.getByDisplayValue(accountName);

    // Focus and change the name
    await user.click(input);
    await user.clear(input);
    await user.type(input, "New Account Name");

    expect(input).toHaveValue("New Account Name");
  });

  test("should display currency icon and name", () => {
    render(<AccountHeader account={mockAccount} parentAccount={null} />, { initialState });

    expect(screen.getByText(currency.name)).toBeInTheDocument();
  });
});
