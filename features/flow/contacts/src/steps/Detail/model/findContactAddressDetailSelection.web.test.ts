import { createContactDetailAddressRowIntent } from "./viewModel";
import { findContactAddressDetailSelection } from "./findContactAddressDetailSelection";
import {
  mockContact,
  mockContactAddress,
} from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

describe("findContactAddressDetailSelection", () => {
  it("returns the selected row and its network group", () => {
    const contact = mockContact({
      addresses: [
        mockContactAddress({
          id: "address-ethereum",
          currencyId: "ethereum",
          label: "Ethereum",
        }),
      ],
    });
    const address = contact.addresses[0]!;
    const row = {
      addressId: address.id,
      label: address.label,
      address: address.address,
      currencyId: address.currencyId,
      intent: createContactDetailAddressRowIntent(contact.id, address.id),
    };
    const network = {
      networkId: getCryptoCurrencyById("ethereum").id,
      networkName: getCryptoCurrencyById("ethereum").name,
      networkTicker: getCryptoCurrencyById("ethereum").ticker,
      rows: [row],
    };

    expect(findContactAddressDetailSelection([network], address.id)).toEqual({
      row,
      network,
    });
  });

  it("returns undefined when the address is not in any group", () => {
    const contact = mockContact({
      addresses: [mockContactAddress({ id: "address-ethereum" })],
    });
    const address = contact.addresses[0]!;

    expect(
      findContactAddressDetailSelection([], address.id),
    ).toBeUndefined();
  });
});
