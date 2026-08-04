import { getWalletAccount } from "./getWalletAccount";
import type { Account } from "@ledgerhq/types-live";

const walletAccount = { xpub: { xpub: "xpub6D" } };

const account = (overrides: Partial<Account> = {}, resources: unknown = { walletAccount }) =>
  ({ id: "js:2:zcash:xpub6D:", bitcoinResources: resources, ...overrides }) as Account;

describe("getWalletAccount", () => {
  it("hands back the wallet-btc account carried by the Ledger Live account", () => {
    expect(getWalletAccount(account())).toBe(walletAccount);
  });

  // Both cases mean the same thing to the caller: the account has no usable
  // transparent state and has to be synced again before it can be spent from.
  it.each([
    [
      "the account predates the wallet-btc migration",
      { id: "libcore:1:zcash:xpub6D:" },
      { walletAccount },
    ],
    ["it has never been synced", {}, null],
    ["its resources carry no wallet account", {}, { utxos: [] }],
  ])("asks for a resync when %s", (_label, overrides, resources) => {
    expect(() => getWalletAccount(account(overrides as Partial<Account>, resources))).toThrow(
      expect.objectContaining({ name: "AccountNeedResync" }),
    );
  });
});
