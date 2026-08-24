import {
  findContactWithMultipleAddressesByName,
  getContactsOnNetwork,
  hasContactsOnNetwork,
} from "../hasContactsOnNetwork";

describe("hasContactsOnNetwork", () => {
  it("returns false when no contacts are registered", () => {
    expect(hasContactsOnNetwork([], "ethereum")).toBe(false);
  });

  it("returns false when contacts only have addresses on other networks", () => {
    const contacts = [
      {
        addresses: [
          {
            currencyId: "solana",
          },
        ],
      },
      {
        addresses: [
          {
            currencyId: "polygon",
          },
        ],
      },
    ];

    expect(hasContactsOnNetwork(contacts, "ethereum")).toBe(false);
  });

  it("returns true when a contact has an address on the target network", () => {
    const contacts = [
      {
        addresses: [
          {
            currencyId: "solana",
          },
        ],
      },
      {
        addresses: [
          {
            currencyId: "ethereum",
          },
        ],
      },
    ];

    expect(hasContactsOnNetwork(contacts, "ethereum")).toBe(true);
    expect(hasContactsOnNetwork(contacts, "ethereum/erc20/usdc")).toBe(true);
  });

  it("matches token networks using the parent currency id", () => {
    const contacts = [
      {
        addresses: [
          {
            currencyId: "base/erc20/usd_coin",
          },
        ],
      },
    ];

    expect(hasContactsOnNetwork(contacts, "base")).toBe(true);
    expect(hasContactsOnNetwork(contacts, "ethereum")).toBe(false);
  });

  it("ignores the user's own contact", () => {
    const contacts = [
      {
        isMe: true,
        addresses: [{ currencyId: "ethereum" }],
      },
    ];

    expect(hasContactsOnNetwork(contacts, "ethereum")).toBe(false);
  });
});

describe("getContactsOnNetwork", () => {
  it("keeps saved contacts and only their addresses on the target network", () => {
    const contacts = [
      {
        id: "me",
        name: "Me",
        isMe: true,
        addresses: [{ id: "me-eth", currencyId: "ethereum" }],
      },
      {
        id: "alice",
        name: "Alice",
        isMe: false,
        addresses: [
          { id: "alice-eth", currencyId: "ethereum" },
          { id: "alice-usdc", currencyId: "ethereum/erc20/usd_coin" },
          { id: "alice-sol", currencyId: "solana" },
        ],
      },
      {
        id: "bob",
        name: "Bob",
        isMe: false,
        addresses: [{ id: "bob-btc", currencyId: "bitcoin" }],
      },
    ];

    expect(getContactsOnNetwork(contacts, "ethereum")).toEqual([
      {
        id: "alice",
        name: "Alice",
        isMe: false,
        addresses: [
          { id: "alice-eth", currencyId: "ethereum" },
          { id: "alice-usdc", currencyId: "ethereum/erc20/usd_coin" },
        ],
      },
    ]);
    expect(contacts[1].addresses).toHaveLength(3);
  });
});

describe("findContactWithMultipleAddressesByName", () => {
  const contacts = [
    {
      name: "Alice",
      addresses: [{ currencyId: "ethereum" }, { currencyId: "ethereum/erc20/usd_coin" }],
    },
    {
      name: "Bob",
      addresses: [{ currencyId: "ethereum" }],
    },
  ];

  it("finds an exact contact name regardless of surrounding spaces and case", () => {
    expect(findContactWithMultipleAddressesByName(contacts, "  ALICE ")).toBe(contacts[0]);
  });

  it("does not return contacts with only one address", () => {
    expect(findContactWithMultipleAddressesByName(contacts, "Bob")).toBeUndefined();
  });

  it("does not return a contact for an empty or partial name", () => {
    expect(findContactWithMultipleAddressesByName(contacts, " ")).toBeUndefined();
    expect(findContactWithMultipleAddressesByName(contacts, "Ali")).toBeUndefined();
  });
});
