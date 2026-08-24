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

  it("matches a saved contact from a resolved address when the typed recipient is empty", () => {
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

    expect(findMatchedContact([contact], "   ", "ethereum", vitalikAddress)).toEqual({
      contactId: "remi",
      contactName: "Remi",
      addressId: "remi-ethereum",
      addressLabel: "Eth main",
      address: vitalikAddress,
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

  it("matches a saved contact by its full name, ignoring case and surrounding spaces", () => {
    const contact = {
      id: "benoit",
      isMe: false,
      name: "Benoit",
      addresses: [
        {
          id: "benoit-bitcoin",
          currencyId: "bitcoin",
          label: "Bitcoin",
          address: "bc1qbenoit",
        },
        {
          id: "benoit-ethereum",
          currencyId: "ethereum",
          label: "Ethereum Network",
          address: vitalikAddress,
        },
      ],
    };

    expect(
      findMatchedContact([contact], "  bEnOiT ", "ethereum", undefined, { matchName: true }),
    ).toEqual({
      contactId: "benoit",
      contactName: "Benoit",
      addressId: "benoit-ethereum",
      addressLabel: "Ethereum Network",
      address: vitalikAddress,
    });
  });

  it("does not match a saved contact from an incomplete name", () => {
    const contact = {
      id: "benoit",
      isMe: false,
      name: "Benoit",
      addresses: [
        {
          id: "benoit-ethereum",
          currencyId: "ethereum",
          label: "Ethereum Network",
          address: vitalikAddress,
        },
      ],
    };

    expect(
      findMatchedContact([contact], "ben", "ethereum", undefined, { matchName: true }),
    ).toBeUndefined();
  });

  it("does not match a multi-word contact name from its first word only", () => {
    const contact = {
      id: "benoit",
      isMe: false,
      name: "Benoit Jean",
      addresses: [
        {
          id: "benoit-ethereum",
          currencyId: "ethereum",
          label: "Ethereum Network",
          address: vitalikAddress,
        },
      ],
    };

    expect(
      findMatchedContact([contact], "Benoit", "ethereum", undefined, { matchName: true }),
    ).toBeUndefined();
    expect(
      findMatchedContact([contact], "benoit jean", "ethereum", undefined, { matchName: true }),
    ).toEqual({
      contactId: "benoit",
      contactName: "Benoit Jean",
      addressId: "benoit-ethereum",
      addressLabel: "Ethereum Network",
      address: vitalikAddress,
    });
  });

  it("does not match a contact name when an ENS address was resolved", () => {
    const contact = {
      id: "vitalik",
      isMe: false,
      name: "vitalik.eth",
      addresses: [
        {
          id: "vitalik-contact-ethereum",
          currencyId: "ethereum",
          label: "Ethereum Network",
          address: "0xContactAddress",
        },
      ],
    };

    expect(
      findMatchedContact([contact], "vitalik.eth", "ethereum", vitalikAddress, {
        matchName: true,
      }),
    ).toBeUndefined();
  });

  it("prioritizes the exact currency when a contact has multiple addresses on one network", () => {
    const contact = {
      id: "benoit",
      isMe: false,
      name: "Benoit",
      addresses: [
        {
          id: "benoit-ethereum",
          currencyId: "ethereum",
          label: "Ethereum",
          address: "0xEthereumAddress",
        },
        {
          id: "benoit-usdc",
          currencyId: "ethereum/erc20/usd_coin",
          label: "USDC",
          address: "0xUsdcAddress",
        },
      ],
    };

    expect(
      findMatchedContact([contact], "Benoit", "ethereum/erc20/usd_coin", undefined, {
        matchName: true,
      }),
    ).toEqual({
      contactId: "benoit",
      contactName: "Benoit",
      addressId: "benoit-usdc",
      addressLabel: "USDC",
      address: "0xUsdcAddress",
    });
  });

  it("matches a contact name when several network entries share the same address", () => {
    const contact = {
      id: "benoit",
      isMe: false,
      name: "Benoit",
      addresses: [
        {
          id: "benoit-ethereum",
          currencyId: "ethereum",
          label: "Ethereum",
          address: vitalikAddress,
        },
        {
          id: "benoit-usdc",
          currencyId: "ethereum/erc20/usd_coin",
          label: "USDC",
          address: vitalikAddress.toLowerCase(),
        },
      ],
    };

    expect(
      findMatchedContact([contact], "Benoit", "ethereum/erc20/tether_usd", undefined, {
        matchName: true,
      }),
    ).toEqual({
      contactId: "benoit",
      contactName: "Benoit",
      addressId: "benoit-ethereum",
      addressLabel: "Ethereum",
      address: vitalikAddress,
    });
  });

  it("does not match a contact name when network entries have distinct addresses", () => {
    const contact = {
      id: "benoit",
      isMe: false,
      name: "Benoit",
      addresses: [
        {
          id: "benoit-ethereum",
          currencyId: "ethereum",
          label: "Ethereum",
          address: "0xEthereumAddress",
        },
        {
          id: "benoit-usdc",
          currencyId: "ethereum/erc20/usd_coin",
          label: "USDC",
          address: "0xUsdcAddress",
        },
      ],
    };

    expect(
      findMatchedContact([contact], "Benoit", "ethereum/erc20/tether_usd", undefined, {
        matchName: true,
      }),
    ).toBeUndefined();
  });

  it("matches a contact name when several exact-currency entries share the same address", () => {
    const contact = {
      id: "benoit",
      isMe: false,
      name: "Benoit",
      addresses: [
        {
          id: "benoit-ethereum-work",
          currencyId: "ethereum",
          label: "Work",
          address: vitalikAddress,
        },
        {
          id: "benoit-ethereum-home",
          currencyId: "ethereum",
          label: "Home",
          address: vitalikAddress.toLowerCase(),
        },
      ],
    };

    expect(
      findMatchedContact([contact], "Benoit", "ethereum", undefined, { matchName: true }),
    ).toEqual({
      contactId: "benoit",
      contactName: "Benoit",
      addressId: "benoit-ethereum-work",
      addressLabel: "Work",
      address: vitalikAddress,
    });
  });

  it("does not match a contact name when exact-currency entries have distinct addresses", () => {
    const contact = {
      id: "benoit",
      isMe: false,
      name: "Benoit",
      addresses: [
        {
          id: "benoit-ethereum-work",
          currencyId: "ethereum",
          label: "Work",
          address: "0xEthereumWorkAddress",
        },
        {
          id: "benoit-ethereum-home",
          currencyId: "ethereum",
          label: "Home",
          address: "0xEthereumHomeAddress",
        },
      ],
    };

    expect(
      findMatchedContact([contact], "Benoit", "ethereum", undefined, { matchName: true }),
    ).toBeUndefined();
  });
});
