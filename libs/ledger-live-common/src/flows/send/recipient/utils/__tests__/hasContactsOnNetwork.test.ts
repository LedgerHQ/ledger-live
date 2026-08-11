import { hasContactsOnNetwork } from "../hasContactsOnNetwork";

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
});
