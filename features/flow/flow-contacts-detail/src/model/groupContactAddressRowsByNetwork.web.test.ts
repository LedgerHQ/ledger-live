import {
  mockContact,
  mockContactAddress,
  mockContactWithMultipleAddresses,
} from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { ContactAddressCurrencyPort } from "./ports";
import { createContactDetailAddressRowIntent } from "./viewModel";
import { groupContactAddressRowsByNetwork } from "./groupContactAddressRowsByNetwork";

const currencyPort: ContactAddressCurrencyPort = {
  resolveNetworkId: currencyId => {
    if (currencyId === getCryptoCurrencyById("ethereum").id) {
      return getCryptoCurrencyById("ethereum").id;
    }

    if (currencyId === getCryptoCurrencyById("polygon").id) {
      return getCryptoCurrencyById("polygon").id;
    }

    if (currencyId === "ethereum/erc20/usd-coin") {
      return getCryptoCurrencyById("ethereum").id;
    }

    return undefined;
  },
};

describe("groupContactAddressRowsByNetwork", () => {
  it("groups consecutive rows by network while preserving row order inside each group", () => {
    const contact = mockContact({
      addresses: [
        mockContactAddress({
          id: "address-usdc",
          currencyId: "ethereum/erc20/usd-coin",
          label: "USDC",
        }),
        mockContactAddress({
          id: "address-ethereum-base",
          currencyId: "ethereum",
          label: "Ethereum",
        }),
        mockContactAddress({
          id: "address-polygon",
          currencyId: "polygon",
          label: "Polygon",
        }),
      ],
    });

    const rows = contact.addresses.map(address => ({
      addressId: address.id,
      label: address.label,
      address: address.address,
      currencyId: address.currencyId,
      intent: createContactDetailAddressRowIntent(contact.id, address.id),
    }));

    expect(groupContactAddressRowsByNetwork(rows, currencyPort)).toEqual([
      {
        networkId: "ethereum",
        networkName: getCryptoCurrencyById("ethereum").name,
        networkTicker: getCryptoCurrencyById("ethereum").ticker,
        rows: [rows[0], rows[1]],
      },
      {
        networkId: "polygon",
        networkName: getCryptoCurrencyById("polygon").name,
        networkTicker: getCryptoCurrencyById("polygon").ticker,
        rows: [rows[2]],
      },
    ]);
  });

  it("groups unknown-network rows instead of dropping them", () => {
    const contact = mockContact({
      addresses: [
        mockContactAddress({
          id: "address-unknown",
          currencyId: "unknown-currency-id",
          label: "Custom Asset",
        }),
      ],
    });

    const rows = contact.addresses.map(address => ({
      addressId: address.id,
      label: address.label,
      address: address.address,
      currencyId: address.currencyId,
      intent: createContactDetailAddressRowIntent(contact.id, address.id),
    }));

    expect(groupContactAddressRowsByNetwork(rows, currencyPort)).toEqual([
      {
        networkId: "unknown-currency-id",
        networkName: "Custom Asset",
        networkTicker: "Custom Asset",
        rows: [rows[0]],
      },
    ]);
  });
});
