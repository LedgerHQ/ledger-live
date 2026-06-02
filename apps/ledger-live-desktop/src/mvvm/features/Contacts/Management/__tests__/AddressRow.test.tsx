import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import type { ContactEntry } from "~/renderer/contacts/types";
import type { CryptoOption } from "~/mvvm/features/Contacts/constants/topCryptos";
import { AddressRow } from "../components/AddressRow";

const entry: ContactEntry = {
  scope: "Cold storage",
  addressHex: "0x" + "0".repeat(40),
  hmacRestHex: "",
  derivationPath: "44'/60'/0'/0/0",
  chainId: 1,
};

const crypto: CryptoOption = {
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  ledgerId: "ethereum",
};

describe("AddressRow", () => {
  it("opens the overflow menu on a right-click anywhere on the row body", () => {
    const onSelect = jest.fn();
    render(<AddressRow entry={entry} crypto={crypto} onSelect={onSelect} />);

    // Menu items aren't in the DOM until the popover opens.
    expect(
      screen.queryByTestId("contacts-management-address-menu-qr"),
    ).not.toBeInTheDocument();

    const row = screen.getByTestId("contacts-management-address-row");
    fireEvent.contextMenu(row);

    // Popover now mounted — all 5 actions present.
    expect(
      screen.getByTestId("contacts-management-address-menu-qr"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contacts-management-address-menu-delete"),
    ).toBeInTheDocument();

    // Right-click MUST NOT also trigger the row's onClick selection —
    // the contextmenu handler calls `preventDefault`, which would
    // suppress the click. Even so, contextmenu and click are separate
    // events; just defensively assert no selection happened.
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("still opens via the '…' IconButton (left-click) — both gestures share one menu", async () => {
    const { user } = render(
      <AddressRow entry={entry} crypto={crypto} onSelect={jest.fn()} />,
    );

    await user.click(screen.getByTestId("contacts-management-address-actions"));

    expect(
      screen.getByTestId("contacts-management-address-menu-qr"),
    ).toBeInTheDocument();
  });

  it("a left-click on the row body still opens the detail dialog (onSelect)", async () => {
    const onSelect = jest.fn();
    const { user } = render(
      <AddressRow entry={entry} crypto={crypto} onSelect={onSelect} />,
    );

    await user.click(screen.getByTestId("contacts-management-address-row"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(entry);
  });
});
