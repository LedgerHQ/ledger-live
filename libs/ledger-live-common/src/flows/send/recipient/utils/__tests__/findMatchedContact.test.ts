import { findMatchedContact } from "../findMatchedContact";

const vitalikAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

describe("findMatchedContact", () => {
  it("prioritizes a saved contact over the Me contact for the same EVM address", () => {
    const meContact = {
      id: "me",
      isMe: true,
      name: "Me",
      addresses: [
        {
          id: "me-ethereum",
          currencyId: "ethereum",
          label: "Ethereum Network",
          address: vitalikAddress,
        },
      ],
    };
    const remiContact = {
      id: "remi",
      isMe: false,
      name: "Remi",
      addresses: [
        {
          id: "remi-ethereum",
          currencyId: "ethereum",
          label: "Eth main",
          address: vitalikAddress.toLowerCase(),
        },
      ],
    };

    expect(findMatchedContact([meContact, remiContact], vitalikAddress, "ethereum")).toEqual({
      contactId: "remi",
      contactName: "Remi",
      addressId: "remi-ethereum",
      addressLabel: "Eth main",
      address: vitalikAddress.toLowerCase(),
    });
  });

  it("matches a saved contact when an ENS resolves to its address", () => {
    const contact = {
      id: "remi",
      isMe: false,
      name: "Remi",
      addresses: [
        {
          id: "remi-ethereum",
          currencyId: "ethereum",
          label: "Eth main",
          address: vitalikAddress,
        },
      ],
    };

    expect(
      findMatchedContact([contact], "vitalik.eth", "ethereum", vitalikAddress.toLowerCase()),
    ).toEqual({
      contactId: "remi",
      contactName: "Remi",
      addressId: "remi-ethereum",
      addressLabel: "Eth main",
      address: vitalikAddress,
    });
  });
});
