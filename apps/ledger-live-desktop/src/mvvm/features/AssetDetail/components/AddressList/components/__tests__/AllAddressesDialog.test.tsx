import React from "react";
import { render, screen, waitFor, within } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { AllAddressesDialog } from "../AllAddressesDialog";

const btc = getCryptoCurrencyById("bitcoin");

describe("AllAddressesDialog", () => {
  const accounts = [
    genAccount("asset-detail-all-addresses-1", { currency: btc }),
    genAccount("asset-detail-all-addresses-2", { currency: btc }),
  ];

  it("renders all addresses when open", () => {
    render(
      <AllAddressesDialog
        open
        title="Addresses"
        description="All your addresses holding BTC."
        sortedAccounts={accounts}
        lookupParentAccount={() => null}
        onAccountClick={jest.fn()}
        onOpenChange={jest.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeVisible();
    expect(within(dialog).getByRole("heading", { name: "Addresses" })).toBeVisible();
    expect(within(dialog).getByTestId("asset-detail-all-addresses-list")).toBeVisible();
    expect(within(dialog).getAllByTestId(/asset-detail-address-row-/)).toHaveLength(2);
  });

  it("invokes onOpenChange(false) when the close button is clicked", async () => {
    const onOpenChange = jest.fn();
    const { user } = render(
      <AllAddressesDialog
        open
        title="Addresses"
        description="All your addresses holding BTC."
        sortedAccounts={accounts}
        lookupParentAccount={() => null}
        onAccountClick={jest.fn()}
        onOpenChange={onOpenChange}
      />,
    );

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /close/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
