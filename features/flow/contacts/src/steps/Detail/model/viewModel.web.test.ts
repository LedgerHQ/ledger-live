import {
  mockContact,
  mockContactAddress,
  mockContactWithMultipleAddresses,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { ContactAddressCurrencyPort } from "./ports";
import { sortContactAddressesByNetwork } from "./sortContactAddressesByNetwork";
import {
  createContactDetailAddressRowIntent,
  createPopulatedContactDetailViewModel,
} from "./viewModel";

const TEST_NETWORK_ORDER = [
  getCryptoCurrencyById("ethereum").id,
  getCryptoCurrencyById("polygon").id,
  getCryptoCurrencyById("bitcoin").id,
] as const;

function createCurrencyPort(
  resolveNetworkId: ContactAddressCurrencyPort["resolveNetworkId"],
): ContactAddressCurrencyPort {
  return { resolveNetworkId };
}

describe("sortContactAddressesByNetwork", () => {
  const currencyPort = createCurrencyPort(currencyId => {
    if (currencyId === getCryptoCurrencyById("ethereum").id) {
      return getCryptoCurrencyById("ethereum").id;
    }

    if (currencyId === getCryptoCurrencyById("polygon").id) {
      return getCryptoCurrencyById("polygon").id;
    }

    if (currencyId === getCryptoCurrencyById("bitcoin").id) {
      return getCryptoCurrencyById("bitcoin").id;
    }

    if (currencyId === "ethereum/erc20/usd-coin") {
      return getCryptoCurrencyById("ethereum").id;
    }

    return undefined;
  });

  it("orders address rows by production network order", () => {
    const addresses = [
      mockContactAddress({
        id: "address-polygon",
        currencyId: "polygon",
        label: "Polygon",
      }),
      mockContactAddress({
        id: "address-ethereum",
        currencyId: "ethereum",
        label: "Ethereum",
      }),
      mockContactAddress({
        id: "address-bitcoin",
        currencyId: "bitcoin",
        label: "Bitcoin",
      }),
    ];

    expect(
      sortContactAddressesByNetwork(addresses, currencyPort, TEST_NETWORK_ORDER).map(
        address => address.id,
      ),
    ).toEqual(["address-ethereum", "address-polygon", "address-bitcoin"]);
  });

  it("groups token addresses under their parent network order", () => {
    const addresses = [
      mockContactAddress({
        id: "address-usdc",
        currencyId: "ethereum/erc20/usd-coin",
        label: "USDC",
      }),
      mockContactAddress({
        id: "address-polygon",
        currencyId: "polygon",
        label: "Polygon",
      }),
    ];

    expect(
      sortContactAddressesByNetwork(addresses, currencyPort, TEST_NETWORK_ORDER).map(
        address => address.id,
      ),
    ).toEqual(["address-usdc", "address-polygon"]);
  });
});

describe("createPopulatedContactDetailViewModel", () => {
  const currencyPort = createCurrencyPort(currencyId => {
    if (currencyId === getCryptoCurrencyById("ethereum").id) {
      return getCryptoCurrencyById("ethereum").id;
    }

    if (currencyId === getCryptoCurrencyById("polygon").id) {
      return getCryptoCurrencyById("polygon").id;
    }

    return undefined;
  });

  it("returns populated detail state when the contact has addresses", () => {
    const contact = mockContactWithMultipleAddresses();

    expect(createPopulatedContactDetailViewModel(contact, currencyPort)).toMatchObject({
      displayMode: "populated",
      contact,
    });
  });

  it("exposes the address count", () => {
    const contact = mockContactWithMultipleAddresses();

    expect(createPopulatedContactDetailViewModel(contact, currencyPort).addressCount).toBe(2);
  });

  it("orders address rows by network", () => {
    const contact = mockContactWithMultipleAddresses();
    const viewModel = createPopulatedContactDetailViewModel(
      contact,
      currencyPort,
      TEST_NETWORK_ORDER,
    );

    expect(
      viewModel.addressGroups.flatMap(group => group.rows.map(row => row.addressId)),
    ).toEqual(["address-ethereum", "address-polygon"]);
  });

  it("groups address rows by network", () => {
    const contact = mockContactWithMultipleAddresses();
    const viewModel = createPopulatedContactDetailViewModel(
      contact,
      currencyPort,
      TEST_NETWORK_ORDER,
    );

    expect(viewModel.addressGroups.map(group => group.networkId)).toEqual(["ethereum", "polygon"]);
    expect(viewModel.addressGroups[0]?.rows.map(row => row.addressId)).toEqual(["address-ethereum"]);
    expect(viewModel.addressGroups[1]?.rows.map(row => row.addressId)).toEqual(["address-polygon"]);
  });

  it("exposes an open-address-detail intent on each row", () => {
    const contact = mockContact({
      addresses: [
        mockContactAddress({
          id: "address-ethereum",
          currencyId: "ethereum",
          label: "Ethereum",
        }),
      ],
    });

    const address = contact.addresses[0];

    expect(address).toBeDefined();
    expect(
      createPopulatedContactDetailViewModel(contact, currencyPort).addressGroups[0]?.rows,
    ).toEqual([
      {
        addressId: "address-ethereum",
        label: "Ethereum",
        address: address!.address,
        currencyId: "ethereum",
        intent: createContactDetailAddressRowIntent(contact.id, address!.id),
      },
    ]);
  });
});

describe("createContactDetailAddressRowIntent", () => {
  it("creates an open-address-detail intent for the selected row", () => {
    const contact = mockMeContact({
      addresses: [mockContactAddress({ id: "address-me-ethereum" })],
    });
    const address = contact.addresses[0];

    expect(address).toBeDefined();
    expect(createContactDetailAddressRowIntent(contact.id, address!.id)).toEqual({
      type: "open-address-detail",
      contactId: contact.id,
      addressId: "address-me-ethereum",
    });
  });
});
