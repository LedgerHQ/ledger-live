import React from "react";
import { within } from "@testing-library/react";
import { render, screen } from "tests/testSetup";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import CryptoAddresses from "../index";
import useCryptoAddressesViewModel from "../hooks/useCryptoAddressesViewModel";
import type { CryptoAddressesViewModel } from "../types";
import { createWalletState } from "../testUtils/createWalletState";

jest.mock("../hooks/useCryptoAddressesViewModel");

const mockedUseCryptoAddressesViewModel = jest.mocked(useCryptoAddressesViewModel);

const baseViewModel: CryptoAddressesViewModel = {
  searchValue: "",
  setSearchValue: jest.fn(),
  emptyTableMessage: "",
  onAddAddressClick: jest.fn(),
  onAccountClick: jest.fn(),
  rows: [],
  lookupParentAccount: jest.fn(),
};

describe("CryptoAddresses (Crypto page)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCryptoAddressesViewModel.mockReturnValue(baseViewModel);
  });

  it("should show header and account list after landing, then call onAccountClick when a row is activated", async () => {
    const onAccountClick = jest.fn();
    const lookupParentAccount = jest.fn();

    mockedUseCryptoAddressesViewModel.mockReturnValue({
      ...baseViewModel,
      rows: [ETH_ACCOUNT],
      onAccountClick,
      lookupParentAccount,
    });

    const { user } = render(<CryptoAddresses />, {
      initialState: createWalletState(new Map([[ETH_ACCOUNT.id, "My ETH account"]])),
    });

    // Land on the Crypto page — page title in the header
    expect(screen.getByText("Crypto accounts")).toBeVisible();

    // Main content area with search / actions and the table
    const pageContent = screen.getByTestId("crypto-page-content");
    expect(pageContent).toBeVisible();

    // Account list: column headers and at least one data row
    expect(within(pageContent).getByRole("columnheader", { name: "Name" })).toBeVisible();
    expect(within(pageContent).getByRole("columnheader", { name: "Address" })).toBeVisible();
    expect(within(pageContent).getByRole("columnheader", { name: "Value" })).toBeVisible();

    const nameCell = within(pageContent).getByRole("button", { name: /My ETH account/ });
    expect(nameCell).toBeVisible();

    // Action on the list: user selects an account (name cell triggers row navigation)
    await user.click(nameCell);

    expect(onAccountClick).toHaveBeenCalledTimes(1);
    expect(onAccountClick).toHaveBeenCalledWith(ETH_ACCOUNT, undefined);
  });
});
