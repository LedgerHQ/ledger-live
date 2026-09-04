import type { PayCardInternalWallet, PayCardLinkedWallet } from "@domain/api-card-management";
import { combineCardLinkedWallets } from "../logic/combineCardLinkedWallets";
import type { ResolveWalletCounterValue } from "../types";

const internal: PayCardInternalWallet[] = [
  {
    id: "w-usdc",
    balance: "125.40",
    currency: "usdc",
    address: "0xusdc",
    addressMemo: null,
    addressId: "addr-w-usdc",
  },
  {
    id: "w-usdt",
    balance: "10.00",
    currency: "usdt",
    address: "0xusdt",
    addressMemo: null,
    addressId: "addr-w-usdt",
  },
  {
    id: "w-sol",
    balance: "2.5",
    currency: "sol",
    address: "sol-addr",
    addressMemo: null,
    addressId: "addr-w-sol",
  },
  {
    id: "w-unlinked",
    balance: "999.99",
    currency: "usdc",
    address: "0xunlinked",
    addressMemo: null,
    addressId: "addr-w-unlinked",
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

const rates: Record<string, number> = {
  "ethereum/erc20/usd__coin": 1,
  "ethereum/erc20/usd_tether__erc20_": 1,
  solana: 150,
};
const resolveCounterValue: ResolveWalletCounterValue = (ledgerId, balance) => {
  const rate = rates[ledgerId];
  return rate === undefined ? null : Number(balance) * rate;
};

describe("combineCardLinkedWallets", () => {
  it("returns the linked wallets in charging order, lowest priority first", () => {
    const { wallets } = combineCardLinkedWallets({ linked, internal, resolveCounterValue });

    expect(wallets.map(({ id }) => id)).toEqual(["w-usdc", "w-usdt"]);
  });

  it("joins each link to its balance on id", () => {
    const { wallets } = combineCardLinkedWallets({ linked, internal, resolveCounterValue });

    expect(wallets[0]).toEqual({
      id: "w-usdc",
      address: "0xusdc",
      currency: "usdc",
      network: "ethereum",
      priority: 1,
      ledgerId: "ethereum/erc20/usd__coin",
      balance: "125.40",
      counterValue: 125.4,
    });
  });

  it("totals the counter-values, not the raw balances", () => {
    const { total, isPartialTotal } = combineCardLinkedWallets({
      linked: [
        ...linked,
        {
          id: "w-sol",
          address: "sol-addr",
          currency: "sol",
          network: "solana",
          priority: 3,
          ledgerId: "solana",
        },
      ],
      internal,
      resolveCounterValue,
    });

    expect(total).toBe(510.4);
    expect(isPartialTotal).toBe(false);
  });

  it("leaves out a custodial wallet that funds nothing", () => {
    const { wallets, total } = combineCardLinkedWallets({ linked, internal, resolveCounterValue });

    expect(wallets.map(({ id }) => id)).not.toContain("w-unlinked");
    expect(total).toBe(135.4);
  });

  it("does not mutate the linked list it was handed", () => {
    const cacheEntry: PayCardLinkedWallet[] = [...linked];

    combineCardLinkedWallets({ linked: cacheEntry, internal, resolveCounterValue });

    expect(cacheEntry.map(({ id }) => id)).toEqual(["w-usdt", "w-usdc"]);
  });

  it("keeps a link with no matching balance, and says the total is partial", () => {
    const { wallets, total, isPartialTotal } = combineCardLinkedWallets({
      linked: [
        ...linked,
        {
          id: "w-missing",
          address: "0xmissing",
          currency: "usdc",
          network: "base",
          priority: 4,
          ledgerId: "ethereum/erc20/usd__coin",
        },
      ],
      internal,
      resolveCounterValue,
    });

    expect(wallets.at(-1)).toMatchObject({ id: "w-missing", balance: null, counterValue: null });
    expect(total).toBe(135.4);
    expect(isPartialTotal).toBe(true);
  });

  it("says the total is partial when a rate is missing, rather than counting the asset as zero", () => {
    const { total, isPartialTotal } = combineCardLinkedWallets({
      linked: [
        ...linked,
        {
          id: "w-sol",
          address: "sol-addr",
          currency: "sol",
          network: "solana",
          priority: 3,
          ledgerId: "solana",
        },
      ],
      internal,
      resolveCounterValue: (ledgerId, balance) => (ledgerId === "solana" ? null : Number(balance)),
    });

    expect(total).toBe(135.4);
    expect(isPartialTotal).toBe(true);
  });

  it("treats a NaN counter-value as missing, so the total stays a usable number", () => {
    const { wallets, total, isPartialTotal } = combineCardLinkedWallets({
      linked,
      internal,
      resolveCounterValue: (ledgerId, balance) =>
        ledgerId === "ethereum/erc20/usd_tether__erc20_" ? Number.NaN : Number(balance),
    });

    expect(wallets.find(({ id }) => id === "w-usdt")?.counterValue).toBeNull();
    expect(total).toBe(125.4);
    expect(isPartialTotal).toBe(true);
  });

  it("treats an infinite counter-value as missing", () => {
    const { total, isPartialTotal } = combineCardLinkedWallets({
      linked,
      internal,
      resolveCounterValue: (ledgerId, balance) =>
        ledgerId === "ethereum/erc20/usd_tether__erc20_"
          ? Number.POSITIVE_INFINITY
          : Number(balance),
    });

    expect(total).toBe(125.4);
    expect(isPartialTotal).toBe(true);
  });

  it("reads a card with nothing linked as an empty list and a zero total", () => {
    expect(combineCardLinkedWallets({ linked: [], internal, resolveCounterValue })).toEqual({
      wallets: [],
      total: 0,
      isPartialTotal: false,
    });
  });

  it("does not price a wallet whose asset the catalog does not cover", () => {
    const resolve = jest.fn<number | null, [string, string]>(() => 999);

    const { wallets } = combineCardLinkedWallets({
      linked: [
        { id: "w-bxx", address: "0xbxx", currency: "bxx", network: "ethereum", priority: 1 },
      ],
      internal: [
        { id: "w-bxx", balance: "5.00", currency: "bxx", address: "0xbxx", addressId: "a-bxx" },
      ],
      resolveCounterValue: resolve,
    });

    // The balance is read and shown; only its worth is unknown, and a guess would be worse.
    expect(wallets[0]).toMatchObject({ balance: "5.00", counterValue: null });
    expect(resolve).not.toHaveBeenCalled();
  });

  it("does not resolve a rate for a wallet whose balance never arrived", () => {
    const resolve = jest.fn<number | null, [string, string]>();

    combineCardLinkedWallets({
      linked: [
        {
          id: "w-missing",
          address: "0x",
          currency: "usdc",
          network: "base",
          priority: 1,
          ledgerId: "ethereum/erc20/usd__coin",
        },
      ],
      internal: [],
      resolveCounterValue: resolve,
    });

    expect(resolve).not.toHaveBeenCalled();
  });

  it("keeps a zero balance distinct from a missing one", () => {
    const { wallets, isPartialTotal } = combineCardLinkedWallets({
      linked: [linked[1]],
      internal: [
        {
          id: "w-usdc",
          balance: "0.00",
          currency: "usdc",
          address: "0xusdc",
          addressMemo: null,
          addressId: "addr-w-usdc",
        },
      ],
      resolveCounterValue,
    });

    expect(wallets[0]).toMatchObject({ balance: "0.00", counterValue: 0 });
    expect(isPartialTotal).toBe(false);
  });
});
