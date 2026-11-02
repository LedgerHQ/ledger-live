import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { mockBtcCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { render, screen } from "@tests/test-renderer";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import type { AddressAccountData } from "../../useAddressesViewModel";
import { AddressAccountItem } from "../AddressAccountItem";

const account = genAccount("address-item-account", {
  currency: mockBtcCryptoCurrency,
  operationsSize: 0,
});

const data = (tag?: string): AddressAccountData => ({
  id: account.id,
  account,
  balanceAccount: account,
  name: "BTC Gold",
  tag,
  truncatedAddress: "bc1q...olj7",
});

describe("AddressAccountItem", () => {
  it("shows the address type next to the name of the account", () => {
    render(<AddressAccountItem data={data("Native segwit")} onPress={jest.fn()} />);

    expect(screen.getByText("BTC Gold")).toBeVisible();
    expect(
      screen.getByTestId(`${ASSET_DETAIL_TEST_IDS.addressItemTag}-${account.id}`),
    ).toBeVisible();
    expect(screen.getByText("Native segwit")).toBeVisible();
  });

  it("shows only the name when the account has no address type", () => {
    render(<AddressAccountItem data={data()} onPress={jest.fn()} />);

    expect(screen.getByText("BTC Gold")).toBeVisible();
    expect(
      screen.queryByTestId(`${ASSET_DETAIL_TEST_IDS.addressItemTag}-${account.id}`),
    ).toBeNull();
  });
});
