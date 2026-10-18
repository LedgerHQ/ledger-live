import { mockContactAddress } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { resolveContactAddressIconProps } from "./resolveContactAddressIcon";

describe("resolveContactAddressIconProps", () => {
  const ethereum = getCryptoCurrencyById("ethereum");
  const unknownAddress = mockContactAddress({
    currencyId: "unknown-currency-id",
    label: "Custom Asset",
  });

  it("omits the network badge for native network currencies", () => {
    const nativeAddress = mockContactAddress({
      currencyId: "ethereum",
      label: "Ethereum",
    });

    expect(
      resolveContactAddressIconProps(nativeAddress.currencyId, nativeAddress.label, ethereum.id),
    ).toEqual({
      ledgerId: ethereum.id,
      ticker: ethereum.ticker,
      network: undefined,
    });
  });

  it("shows the network badge when asset and network differ", () => {
    const polygon = getCryptoCurrencyById("polygon");
    const nativeAddress = mockContactAddress({
      currencyId: "ethereum",
      label: "Ethereum",
    });

    expect(
      resolveContactAddressIconProps(nativeAddress.currencyId, nativeAddress.label, polygon.id),
    ).toEqual({
      ledgerId: "ethereum",
      ticker: "ETH",
      network: polygon.id,
    });
  });

  it("falls back to the address label for unknown currency ids", () => {
    expect(
      resolveContactAddressIconProps(unknownAddress.currencyId, unknownAddress.label, ethereum.id),
    ).toEqual({
      ledgerId: unknownAddress.currencyId,
      ticker: unknownAddress.label,
      network: ethereum.id,
    });
  });
});
