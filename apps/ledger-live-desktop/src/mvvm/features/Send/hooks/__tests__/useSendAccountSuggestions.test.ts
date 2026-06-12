/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { ContactsWallet } from "~/renderer/contacts/types";
import { buildSendAccountSuggestions } from "../useSendAccountSuggestions";

// Only the fields the builder reads.
const account = (
  id: string,
  currencyId: string,
  freshAddress: string,
  freshAddressPath = `44'/60'/0'/0/0`,
): Account =>
  ({
    id,
    freshAddress,
    freshAddressPath,
    currency: { id: currencyId, ticker: currencyId === "ethereum" ? "ETH" : "BTC" },
  }) as unknown as Account;

const eth = { type: "CryptoCurrency", id: "ethereum", ticker: "ETH" } as unknown as CryptoCurrency;
const usdc = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  ticker: "USDC",
  parentCurrency: { id: "ethereum", ticker: "ETH" },
} as unknown as TokenCurrency;

const ACCOUNTS = [
  account("eth_1", "ethereum", "0xAAA1"),
  account("eth_2", "ethereum", "0xBBB2"),
  account("btc_1", "bitcoin", "bc1qxyz"),
];

const NAMES: Record<string, string> = {
  eth_1: "Ethereum 1",
  eth_2: "Jupiter",
  btc_1: "Bitcoin 1",
};

const getName = (a: Account) => NAMES[a.id] ?? a.id;

const walletWith = (accounts: ContactsWallet["accounts"]): ContactsWallet => ({
  contacts: {},
  accounts,
});

describe("buildSendAccountSuggestions", () => {
  it("keeps only accounts on the selected currency's chain", () => {
    const result = buildSendAccountSuggestions(ACCOUNTS, getName, eth, undefined, "");
    expect(result.map(s => s.account?.id)).toEqual(["eth_1", "eth_2"]);
  });

  it("lists parent-chain accounts for a token currency (any ETH account can receive USDC)", () => {
    const result = buildSendAccountSuggestions(ACCOUNTS, getName, usdc, undefined, "");
    expect(result.map(s => s.account?.id)).toEqual(["eth_1", "eth_2"]);
  });

  it("excludes the sending account", () => {
    const result = buildSendAccountSuggestions(ACCOUNTS, getName, eth, "eth_1", "");
    expect(result.map(s => s.account?.id)).toEqual(["eth_2"]);
  });

  it("filters by name prefix, case-insensitively", () => {
    const result = buildSendAccountSuggestions(ACCOUNTS, getName, eth, undefined, "ju");
    expect(result.map(s => s.name)).toEqual(["Jupiter"]);
  });

  it("filters by address prefix with or without 0x", () => {
    expect(
      buildSendAccountSuggestions(ACCOUNTS, getName, eth, undefined, "0xbbb").map(
        s => s.account?.id,
      ),
    ).toEqual(["eth_2"]);
    expect(
      buildSendAccountSuggestions(ACCOUNTS, getName, eth, undefined, "bbb").map(
        s => s.account?.id,
      ),
    ).toEqual(["eth_2"]);
  });

  it("returns nothing without a currency", () => {
    expect(buildSendAccountSuggestions(ACCOUNTS, getName, null, undefined, "")).toEqual([]);
  });

  describe("device-signed names (shield badge)", () => {
    it("marks an app account signed when its name matches a registered record", () => {
      const wallet = walletWith({
        Jupiter: {
          name: "Jupiter",
          derivationPath: `44'/60'/0'/0/0`,
          chainId: 1,
          addressHex: "bbb2",
          hmacProofHex: "h",
        },
      });
      const result = buildSendAccountSuggestions(ACCOUNTS, getName, eth, undefined, "", {
        wallet,
        chainId: 1,
      });
      expect(result.map(s => [s.name, s.signed])).toEqual([
        ["Ethereum 1", false],
        ["Jupiter", true],
      ]);
    });

    it("does NOT mark signed when the registered record is on another derivation path", () => {
      const wallet = walletWith({
        Jupiter: {
          name: "Jupiter",
          derivationPath: `44'/60'/1'/0/0`,
          chainId: 1,
          addressHex: "bbb2",
          hmacProofHex: "h",
        },
      });
      const result = buildSendAccountSuggestions(ACCOUNTS, getName, eth, undefined, "", {
        wallet,
        chainId: 1,
      });
      expect(result.find(s => s.name === "Jupiter")?.signed).toBe(false);
    });

    it("appends device-registered accounts with no app-side account (signed, no balance)", () => {
      const wallet = walletWith({
        "Cold storage": {
          name: "Cold storage",
          derivationPath: `44'/60'/2'/0/0`,
          chainId: 1,
          addressHex: "CC".repeat(20),
          hmacProofHex: "h",
        },
      });
      const result = buildSendAccountSuggestions(ACCOUNTS, getName, eth, undefined, "", {
        wallet,
        chainId: 1,
      });
      const registered = result.find(s => s.name === "Cold storage");
      expect(registered).toMatchObject({
        id: "registered:Cold storage",
        signed: true,
        address: `0x${"cc".repeat(20)}`,
        currencyId: "ethereum",
        ticker: "ETH",
      });
      expect(registered?.account).toBeUndefined();
    });

    it("dedups registered records already covered by an app account or the sender", () => {
      const wallet = walletWith({
        // Same address as eth_2 → covered by the app account row.
        Dup: {
          name: "Dup",
          derivationPath: "x",
          chainId: 1,
          addressHex: "0xBBB2",
          hmacProofHex: "h",
        },
        // Same address as the SENDER (eth_1) → never listed.
        Self: {
          name: "Self",
          derivationPath: "y",
          chainId: 1,
          addressHex: "0xAAA1",
          hmacProofHex: "h",
        },
      });
      const result = buildSendAccountSuggestions(ACCOUNTS, getName, eth, "eth_1", "", {
        wallet,
        chainId: 1,
      });
      expect(result.map(s => s.name)).toEqual(["Jupiter"]);
    });

    it("skips registered records on another chain", () => {
      const wallet = walletWith({
        Polygon: {
          name: "Polygon",
          derivationPath: "x",
          chainId: 137,
          addressHex: "DD".repeat(20),
          hmacProofHex: "h",
        },
      });
      const result = buildSendAccountSuggestions(ACCOUNTS, getName, eth, undefined, "", {
        wallet,
        chainId: 1,
      });
      expect(result.find(s => s.name === "Polygon")).toBeUndefined();
    });
  });
});
