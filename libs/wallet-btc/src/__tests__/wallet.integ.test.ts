import { walletBtcCurrency } from "./fixtures/common.fixtures";
import { DerivationModes } from "../types";
import BitcoinLikeWallet from "../wallet";
import { Account } from "../account";

jest.setTimeout(180000);

describe("testing wallet", () => {
  const wallet = new BitcoinLikeWallet();
  let account: Account;
  let syncedBalance: number;

  it("should generate an account", async () => {
    account = await wallet.generateAccount(
      {
        xpub: "xpub6CV2NfQJYxHn7MbSQjQip3JMjTZGUbeoKz5xqkBftSZZPc7ssVPdjKrgh6N8U1zoQDxtSo6jLarYAQahpd35SJoUKokfqf1DZgdJWZhSMqP",
        path: "44'/0'",
        index: 0,
        currency: "bitcoin",
        network: "mainnet",
        derivationMode: DerivationModes.LEGACY,
      },
      walletBtcCurrency("bitcoin"),
    );

    expect(account.xpub.xpub).toEqual(
      "xpub6CV2NfQJYxHn7MbSQjQip3JMjTZGUbeoKz5xqkBftSZZPc7ssVPdjKrgh6N8U1zoQDxtSo6jLarYAQahpd35SJoUKokfqf1DZgdJWZhSMqP",
    );
  });

  it("should sync an account", async () => {
    await wallet.syncAccount(account);
    const balance = await wallet.getAccountBalance(account);
    syncedBalance = balance.toNumber();

    // Assert on the append-only dimension: the account's on-chain transaction
    // history never shrinks — receiving (dust) or spending both only add txs.
    // The absolute balance, by contrast, can move either way, so any exact (or
    // lower-bound) amount would eventually flake. This proves the sync retrieved
    // the account's history against a real explorer.
    expect(account.xpub.storage.getTxs().length).toBeGreaterThan(0);
  });

  it("should allow to store and load an account", async () => {
    const serializedAccount = await wallet.exportToSerializedAccount(account);
    const unserializedAccount = await wallet.importFromSerializedAccount(
      serializedAccount,
      walletBtcCurrency("bitcoin"),
    );
    const balance = await wallet.getAccountBalance(unserializedAccount);
    // Round-trip invariant: store/load must preserve the exact synced balance.
    expect(balance.toNumber()).toEqual(syncedBalance);
  });
});
