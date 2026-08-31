import { mockContactAddress } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { ContactAddressDetailPort } from "./ports";
import { createContactAddressDetailViewModel } from "./addressDetailViewModel";

const ethereum = getCryptoCurrencyById("ethereum");

const addressDetailPort: ContactAddressDetailPort = {
  resolveNetwork: () => ({
    id: ethereum.id,
    name: ethereum.name,
  }),
  resolveAsset: () => ({
    currencyId: ethereum.id,
    name: ethereum.name,
    ticker: ethereum.ticker,
  }),
  resolveQrPayload: contactAddress => contactAddress.address,
};

describe("createContactAddressDetailViewModel", () => {
  it("exposes the selected address payload", () => {
    const contactAddress = mockContactAddress();
    const port: ContactAddressDetailPort = {
      ...addressDetailPort,
      resolveQrPayload: () => "qr:0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    };

    expect(createContactAddressDetailViewModel(contactAddress, port)).toEqual({
      displayMode: "found",
      address: contactAddress.address,
      label: contactAddress.label,
      network: {
        id: ethereum.id,
        name: ethereum.name,
      },
      asset: {
        currencyId: ethereum.id,
        name: ethereum.name,
        ticker: ethereum.ticker,
      },
      qrPayload: "qr:0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    });
  });

  it("returns not-found when the address does not exist", () => {
    expect(createContactAddressDetailViewModel(undefined, addressDetailPort)).toEqual({
      displayMode: "not-found",
    });
  });
});
