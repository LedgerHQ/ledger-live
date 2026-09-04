import { filterContactsByNetwork } from "../filterContactsByNetwork";

describe("filterContactsByNetwork", () => {
  const ethereumAddress = {
    id: "address-ethereum",
    currencyId: "ethereum",
  };
  const usdcAddress = {
    id: "address-usdc",
    currencyId: "ethereum/erc20/usd_coin",
  };
  const solanaAddress = {
    id: "address-solana",
    currencyId: "solana",
  };

  it("keeps contacts and addresses matching the recipient network", () => {
    const contacts = [
      {
        id: "contact-ethereum",
        isMe: false,
        addresses: [ethereumAddress, usdcAddress, solanaAddress],
      },
      {
        id: "contact-solana",
        isMe: false,
        addresses: [solanaAddress],
      },
    ];

    expect(filterContactsByNetwork(contacts, "ethereum")).toEqual([
      {
        id: "contact-ethereum",
        isMe: false,
        addresses: [ethereumAddress, usdcAddress],
      },
    ]);
  });

  it("resolves a token currency to its parent network", () => {
    const contacts = [
      {
        id: "contact-ethereum",
        isMe: false,
        addresses: [ethereumAddress, usdcAddress],
      },
    ];

    expect(filterContactsByNetwork(contacts, "ethereum/erc20/usd_coin")).toEqual(contacts);
  });

  it("excludes the personal contact", () => {
    const contacts = [
      {
        id: "contact-me",
        isMe: true,
        addresses: [ethereumAddress],
      },
    ];

    expect(filterContactsByNetwork(contacts, "ethereum")).toEqual([]);
  });
});
