import type { PayCardInternalWallet, PayCardLinkedWallet } from "@domain/api-card-management";
import { combineCardLinkedWallets } from "../logic/combineCardLinkedWallets";
import { CryptoOrTokenCurrencySchema } from "@domain/entity-currency";

const internal: PayCardInternalWallet[] = [
  {
    id: "w-usdc",
    balance: "125.40",
    currency: "usdc",
    address: "0xusdc",
    addressMemo: null,
    addressId: "address-usdc",
  },
  {
    id: "w-usdt",
    balance: "10.00",
    currency: "usdt",
    address: "0xusdt",
    addressMemo: null,
    addressId: "address-usdt",
  },
  {
    id: "w-sol",
    balance: "2.5",
    currency: "sol",
    address: "sol-addr",
    addressMemo: null,
    addressId: "address-sol",
  },
  {
    id: "w-unlinked",
    balance: "999.99",
    currency: "usdc",
    address: "0xunlinked",
    addressMemo: null,
  },
];

const linked: PayCardLinkedWallet[] = [
  {
    id: "w-usdt",
    address: "0xusdt",
    currency: "usdt",
    network: "ethereum",
    priority: 2,
    ledgerId: "ethereum/erc20/usd_tether__erc20_",
  },
  {
    id: "w-usdc",
    address: "0xusdc",
    currency: "usdc",
    network: "ethereum",
    priority: 1,
    ledgerId: "ethereum/erc20/usd__coin",
  },
];

function erc20(id: string, ticker: string) {
  return CryptoOrTokenCurrencySchema.parse({
    type: "TokenCurrency",
    id,
    parentCurrencyId: "ethereum",
    contractAddress: "0x0000000000000000000000000000000000000000",
    tokenType: "erc20",
    name: ticker,
    ticker,
    units: [{ name: ticker, code: ticker, magnitude: 6 }],
  });
}

const usdc = erc20("ethereum/erc20/usd__coin", "USDC");
const usdt = erc20("ethereum/erc20/usd_tether__erc20_", "USDT");

const currencies = new Map([
  [usdc.id, usdc],
  [usdt.id, usdt],
]);

describe("combineCardLinkedWallets", () => {
  it("returns the linked wallets in charging order, lowest priority first", () => {
    const { wallets } = combineCardLinkedWallets({ linked, internal, currencies });

    expect(wallets.map(({ id }) => id)).toEqual(["w-usdc", "w-usdt"]);
  });

  it("joins each link to its balance on id", () => {
    const { wallets } = combineCardLinkedWallets({ linked, internal, currencies });

    expect(wallets[0]).toEqual({
      id: "w-usdc",
      addressId: "address-usdc",
      address: "0xusdc",
      currency: "usdc",
      network: "ethereum",
      priority: 1,
      ledgerId: "ethereum/erc20/usd__coin",
      balance: "125.40",
      ledgerCurrency: usdc,
    });
  });

  it("carries the Ledger currency each link already resolved to", () => {
    const { wallets } = combineCardLinkedWallets({ linked, internal, currencies });

    // The next consumer prices on this, so dropping it here would read as a missing rate.
    expect(wallets.map(({ ledgerId }) => ledgerId)).toEqual([
      "ethereum/erc20/usd__coin",
      "ethereum/erc20/usd_tether__erc20_",
    ]);
  });

  it("leaves the field off for a link the catalog does not cover", () => {
    const { wallets } = combineCardLinkedWallets({
      linked: [
        { id: "w-bxx", address: "0xbxx", currency: "bxx", network: "ethereum", priority: 1 },
      ],
      internal: [
        { id: "w-bxx", balance: "5.00", currency: "bxx", address: "0xbxx", addressMemo: null },
      ],
      currencies,
    });

    // Absent, not `undefined`: the wallet has no Ledger currency, it does not hold one called that.
    expect(wallets[0] && "ledgerId" in wallets[0]).toBe(false);
  });

  it("leaves out a custodial wallet that funds nothing", () => {
    const { wallets } = combineCardLinkedWallets({ linked, internal, currencies });

    expect(wallets.map(({ id }) => id)).not.toContain("w-unlinked");
  });

  it("does not mutate the linked list it was handed", () => {
    const cacheEntry: PayCardLinkedWallet[] = [...linked];

    combineCardLinkedWallets({ linked: cacheEntry, internal, currencies });

    expect(cacheEntry.map(({ id }) => id)).toEqual(["w-usdt", "w-usdc"]);
  });

  it("keeps a zero balance distinct from a missing one", () => {
    const { wallets } = combineCardLinkedWallets({
      linked: [linked[1]],
      internal: [
        { id: "w-usdc", balance: "0.00", currency: "usdc", address: "0xusdc", addressMemo: null },
      ],
      currencies,
    });

    expect(wallets[0]).toMatchObject({ balance: "0.00" });
  });
});
