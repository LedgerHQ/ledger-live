import {
  PayCardInternalWalletsResponseSchema,
  PayCardLinkedWalletsResponseSchema,
  PayCardRewardWalletResponseSchema,
} from "./schema";
import { transformPayCardLinkedWallets } from "./transforms";
import {
  applyPayCardWalletPrioritiesMock,
  clearPayCardWalletsMock,
  emptyPayCardWalletsMock,
  fillPayCardWalletsMock,
  fundPayCardWalletMock,
  mockPayCardInternalWallets,
  mockPayCardLinkedWallets,
  mockPayCardRewardWallet,
  readPayCardReorderMockEnabled,
  readPayCardWalletsMock,
  reorderPayCardLinkedWalletsMock,
  resolvePayCardInternalWalletsMock,
  setPayCardReorderMockEnabled,
} from "./cardWallets.mock";

describe("the mocked wallet responses", () => {
  afterEach(() => {
    clearPayCardWalletsMock();
    setPayCardReorderMockEnabled(false);
  });

  it("answers as the provider is parsed, or the query would reject them", () => {
    expect(
      PayCardInternalWalletsResponseSchema.safeParse(mockPayCardInternalWallets(true)).success,
    ).toBe(true);
    expect(PayCardLinkedWalletsResponseSchema.safeParse(mockPayCardLinkedWallets()).success).toBe(
      true,
    );
    expect(PayCardRewardWalletResponseSchema.safeParse(mockPayCardRewardWallet()).success).toBe(
      true,
    );
  });

  it("describes the same wallets in both answers, because the join keys them by id", () => {
    const internalIds = mockPayCardInternalWallets(true).map(({ id }) => id);
    const linkedIds = mockPayCardLinkedWallets().map(({ id }) => id);

    // Every wallet is linked, so the join drops none of them and shows no unmatched link.
    expect(internalIds).toEqual(linkedIds);
    expect(new Set(internalIds).size).toBe(internalIds.length);
  });

  it("names each wallet for the link by an id of its own, which is not the wallet's", () => {
    const wallets = mockPayCardInternalWallets(true);
    const addressIds = wallets.map(({ addressId }) => addressId);

    // The link request keys on `addressId`, and a duplicate would make a mocked link ambiguous.
    expect(addressIds.every(addressId => addressId !== undefined)).toBe(true);
    expect(new Set(addressIds).size).toBe(wallets.length);
    expect(wallets.every(({ id, addressId }) => addressId !== id)).toBe(true);
  });

  it("answers with more than one wallet, so a row is read against its neighbours", () => {
    expect(mockPayCardLinkedWallets()).toHaveLength(3);
  });

  it("links them in the order they are answered, which is the order they are charged", () => {
    expect(mockPayCardLinkedWallets().map(({ priority }) => priority)).toEqual([0, 1, 2]);
  });

  it("resolves every wallet to a Ledger currency, so the join carries three card assets", () => {
    const assets = transformPayCardLinkedWallets(mockPayCardLinkedWallets());

    // An asset the Baanx catalog does not cover arrives without a `ledgerId` and prices as unknown.
    expect(assets.every(({ ledgerId }) => ledgerId !== undefined)).toBe(true);
    // Three distinct currencies, or the rows would all price alike and the total hide a mistake.
    expect(new Set(assets.map(({ ledgerId }) => ledgerId)).size).toBe(3);
  });

  it("funds every wallet only when asked to, and empties them all otherwise", () => {
    for (const { balance } of mockPayCardInternalWallets(true)) {
      expect(Number(balance)).toBeGreaterThan(0);
    }

    for (const { balance } of mockPayCardInternalWallets(false)) {
      expect(Number(balance)).toBe(0);
    }
  });

  it("does not collide the reward wallet's id with a linked wallet's", () => {
    const linkedIds = new Set(mockPayCardLinkedWallets().map(({ id }) => id));

    expect(linkedIds.has(mockPayCardRewardWallet().id)).toBe(false);
  });

  it("switches between funded, empty and provider wallet answers", () => {
    fillPayCardWalletsMock();
    expect(readPayCardWalletsMock()?.every(wallet => Number(wallet.balance) > 0)).toBe(true);

    emptyPayCardWalletsMock();
    expect(readPayCardWalletsMock()?.every(wallet => Number(wallet.balance) === 0)).toBe(true);

    clearPayCardWalletsMock();
    expect(readPayCardWalletsMock()).toBeUndefined();
  });

  it("resolves the internal-wallet answer in devtool, reorder, onboarding and session order", () => {
    expect(resolvePayCardInternalWalletsMock(undefined, false)).toBeUndefined();
    expect(
      resolvePayCardInternalWalletsMock(undefined, true)?.every(
        ({ balance }) => balance === "0.00",
      ),
    ).toBe(true);
    expect(
      resolvePayCardInternalWalletsMock(true, false)?.every(({ balance }) => Number(balance) > 0),
    ).toBe(true);

    setPayCardReorderMockEnabled(true);
    expect(
      resolvePayCardInternalWalletsMock(false, false)?.every(({ balance }) => Number(balance) > 0),
    ).toBe(true);

    emptyPayCardWalletsMock();
    expect(
      resolvePayCardInternalWalletsMock(true, true)?.every(({ balance }) => balance === "0.00"),
    ).toBe(true);
  });

  it("keeps every linked wallet's balance when the charging order is rewritten", () => {
    fillPayCardWalletsMock();
    const [usdc, btc, sol] = mockPayCardLinkedWallets();

    expect(
      reorderPayCardLinkedWalletsMock([
        { addressId: sol.id, priority: 0 },
        { addressId: usdc.id, priority: 1 },
        { addressId: btc.id, priority: 2 },
      ]),
    ).toBe(true);

    const reordered = mockPayCardLinkedWallets();
    expect(reordered.map(({ currency }) => currency)).toEqual(["sol", "usdc", "btc"]);

    // The join reads an amount from the internal answer by wallet id, so a reorder that dropped a
    // wallet from it, renamed one or zeroed one leaves the row with a ticker and no amount.
    const balanceById = new Map(
      (readPayCardWalletsMock() ?? []).map(({ id, balance }) => [id, balance]),
    );
    expect(reordered.every(({ id }) => Number(balanceById.get(id)) > 0)).toBe(true);
  });

  it("refuses an order that names a wallet it does not link, and keeps the one it holds", () => {
    expect(reorderPayCardLinkedWalletsMock([{ addressId: "not-a-wallet", priority: 0 }])).toBe(
      false,
    );
    expect(mockPayCardLinkedWallets().map(({ priority }) => priority)).toEqual([0, 1, 2]);
  });

  it("should persist a new charging order when reorder is enabled", () => {
    const wallets = mockPayCardLinkedWallets();
    setPayCardReorderMockEnabled(true);

    expect(
      applyPayCardWalletPrioritiesMock({
        wallets: [
          { addressId: wallets[2]!.id, priority: 1 },
          { addressId: wallets[0]!.id, priority: 2 },
          { addressId: wallets[1]!.id, priority: 3 },
        ],
      }),
    ).toBe(true);
    expect(mockPayCardLinkedWallets().map(({ id, priority }) => [id, priority])).toEqual([
      [wallets[2]!.id, 1],
      [wallets[0]!.id, 2],
      [wallets[1]!.id, 3],
    ]);
  });

  it("should refuse a new charging order until the reorder handler is enabled", () => {
    const [first, second] = mockPayCardLinkedWallets();

    expect(
      applyPayCardWalletPrioritiesMock({
        wallets: [
          { addressId: first!.id, priority: 1 },
          { addressId: second!.id, priority: 2 },
        ],
      }),
    ).toBe(false);
    expect(readPayCardReorderMockEnabled()).toBe(false);
    expect(mockPayCardLinkedWallets().map(({ priority }) => priority)).toEqual([0, 1, 2]);
  });

  it("can fund one linked asset without funding its neighbours", () => {
    fundPayCardWalletMock("btc");

    expect(
      readPayCardWalletsMock()?.map(wallet => [wallet.currency, Number(wallet.balance) > 0]),
    ).toEqual([
      ["usdc", false],
      ["btc", true],
      ["sol", false],
    ]);
  });
});
