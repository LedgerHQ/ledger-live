import React from "react";
import { render, screen } from "tests/testSetup";
import { AddressListItemView } from "../AddressListItemView";
import type { AddressListItemViewModel } from "../../hooks/useAddressListItemViewModel";

const viewModel = (
  overrides: Partial<AddressListItemViewModel> = {},
): AddressListItemViewModel => ({
  displayName: "BTC 1",
  tag: undefined,
  formattedAddress: "bc1q...olj7",
  formattedCounterValue: "$1,000",
  cryptoFormatted: "0.01 BTC",
  networkLedgerId: "bitcoin",
  networkTicker: "BTC",
  onClick: jest.fn(),
  rowTestId: "row",
  balanceTestId: "balance",
  tagTestId: "tag",
  ...overrides,
});

describe("AddressListItemView", () => {
  it("shows the address type next to the name of the account", () => {
    render(<AddressListItemView vm={viewModel({ tag: "Native segwit" })} />);

    expect(screen.getByText("BTC 1")).toBeInTheDocument();
    expect(screen.getByTestId("tag")).toHaveTextContent("Native segwit");
  });

  it("shows no tag for an account without address type", () => {
    render(<AddressListItemView vm={viewModel()} />);

    expect(screen.queryByTestId("tag")).toBeNull();
  });
});
