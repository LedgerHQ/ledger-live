import {
  PayCardInternalWalletsResponseSchema,
  PayCardLinkedWalletsResponseSchema,
  PayCardRewardWalletResponseSchema,
} from "./schema";
import { transformPayCardLinkedWallets } from "./transforms";
import {
  clearPayCardWalletsMock,
  emptyPayCardWalletsMock,
  fillPayCardWalletsMock,
  fundPayCardWalletMock,
  mockPayCardInternalWallets,
  mockPayCardLinkedWallets,
  mockPayCardRewardWallet,
  readPayCardWalletsMock,
} from "./cardWallets.mock";

describe("the mocked wallet responses", () => {
  afterEach(clearPayCardWalletsMock);

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
