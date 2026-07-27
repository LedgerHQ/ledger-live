import { BigNumber } from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import type { ZcashAccount, ZcashAccountRaw } from "../types/bridge";

// A bitcoin-shaped zcash AccountRaw, as produced today by coin-bitcoin's
// assignToAccountRaw (bitcoinResources/utxos, no walletAccount populated in
// this fixture -- see file header for why). This is the coexistence
// guarantee under test: an account synced while coin-bitcoin owned Zcash
// must still round-trip through coin-zcash's assignFromAccountRaw/
// assignToAccountRaw once the `zcashCoinModule` flag routes to coin-zcash.
function makeBitcoinShapedAccountRaw(): AccountRaw {
  return {
    id: "js:2:zcash:xpub6Dxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:",
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F",
    freshAddressPath: "44'/133'/0'/0/0",
    freshAddresses: [],
    name: "Zcash 1",
    balance: "100000",
    spendableBalance: "100000",
    blockHeight: 100,
    currencyId: "zcash",
    unitMagnitude: 8,
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    lastSyncDate: "",
    creationDate: new Date().toISOString(),
    bitcoinResources: {
      utxos: [["abcd1234", 0, 99, "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F", "100000", 0, 0]],
    },
  } as unknown as AccountRaw;
}

describe("bridge/serialization", () => {
  it("round-trips bitcoinResources.utxos from a bitcoin-shaped zcash AccountRaw", () => {
    const raw = makeBitcoinShapedAccountRaw();
    const account = { id: raw.id, currency: { id: "zcash" } } as unknown as Account;

    assignFromAccountRaw(raw, account);

    const zcashAccount = account as unknown as ZcashAccount;
    expect(zcashAccount.bitcoinResources.utxos).toHaveLength(1);
    expect(zcashAccount.bitcoinResources.utxos[0]).toMatchObject({
      hash: "abcd1234",
      outputIndex: 0,
      blockHeight: 99,
      address: "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F",
      rbf: false,
      isChange: false,
    });
    expect(zcashAccount.bitcoinResources.utxos[0].value.toString()).toBe("100000");

    const rawOut: AccountRaw = { ...raw };
    delete (rawOut as Partial<ZcashAccountRaw>).bitcoinResources;
    assignToAccountRaw(account, rawOut);

    expect((rawOut as ZcashAccountRaw).bitcoinResources?.utxos).toEqual(
      (raw as ZcashAccountRaw).bitcoinResources?.utxos,
    );
  });

  it("round-trips privateInfo (shielded sync state)", () => {
    const raw = makeBitcoinShapedAccountRaw() as ZcashAccountRaw;
    raw.privateInfo = {
      orchardBalance: "5000",
      saplingBalance: "0",
      syncState: "complete",
      progress: 100,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: "ufvk1abc",
      birthday: "2016-10-28",
      lastSyncTimestamp: 123,
      lastProcessedBlock: 1000,
      transactions: [],
    };

    const account = { id: raw.id, currency: { id: "zcash" } } as unknown as Account;
    assignFromAccountRaw(raw, account);

    const zcashAccount = account as unknown as ZcashAccount;
    expect(zcashAccount.privateInfo?.ufvk).toBe("ufvk1abc");
    expect(zcashAccount.privateInfo?.orchardBalance).toBeInstanceOf(BigNumber);
    expect(zcashAccount.privateInfo?.orchardBalance.toString()).toBe("5000");

    const rawOut: AccountRaw = { ...raw };
    assignToAccountRaw(account, rawOut);
    expect((rawOut as ZcashAccountRaw).privateInfo?.ufvk).toBe("ufvk1abc");
    expect((rawOut as ZcashAccountRaw).privateInfo?.orchardBalance).toBe("5000");
  });

  describe("the transparent bundle of a shielded transaction", () => {
    const rawTransaction = {
      id: "932c99c7",
      hex: "00",
      blockHeight: 3_425_862,
      blockHash: "hash",
      timestamp: 1_700_000_000,
      fee: "15000",
      decryptedData: { orchard_outputs: [], sapling_outputs: [] },
    };

    const withTransactions = (transactions: unknown[]): ZcashAccountRaw => {
      const raw = makeBitcoinShapedAccountRaw() as ZcashAccountRaw;
      raw.privateInfo = {
        orchardBalance: "5000",
        saplingBalance: "0",
        syncState: "complete",
        progress: 100,
        estimatedTimeRemaining: { hours: 0, minutes: 0 },
        ufvk: "ufvk1abc",
        birthday: "2016-10-28",
        lastSyncTimestamp: 123,
        lastProcessedBlock: 1000,
        transactions: transactions as NonNullable<ZcashAccountRaw["privateInfo"]>["transactions"],
      };
      return raw;
    };

    it("round-trips the value that left the shielded pools", () => {
      const raw = withTransactions([
        { ...rawTransaction, transparentOut: "500000", hasTransparentInputs: false },
      ]);
      const account = { id: raw.id, currency: { id: "zcash" } } as unknown as Account;

      assignFromAccountRaw(raw, account);

      const [tx] = (account as unknown as ZcashAccount).privateInfo?.transactions ?? [];
      expect(tx.transparentOut).toBeInstanceOf(BigNumber);
      expect(tx.transparentOut?.toString()).toBe("500000");
      expect(tx.hasTransparentInputs).toBe(false);

      const rawOut: AccountRaw = { ...raw };
      assignToAccountRaw(account, rawOut);

      const [out] = (rawOut as ZcashAccountRaw).privateInfo?.transactions ?? [];
      expect(out.transparentOut).toBe("500000");
      expect(out.hasTransparentInputs).toBe(false);
    });

    // An account persisted before the scanner reported the transparent bundle says
    // nothing about it, and must keep saying nothing: read back as zero it would
    // claim the transaction moved no transparent value, which classifies a
    // shielded→transparent send as a self-transfer.
    it("stays absent when it was never persisted", () => {
      const raw = withTransactions([rawTransaction]);
      const account = { id: raw.id, currency: { id: "zcash" } } as unknown as Account;

      assignFromAccountRaw(raw, account);

      const [tx] = (account as unknown as ZcashAccount).privateInfo?.transactions ?? [];
      expect(tx).not.toHaveProperty("transparentOut");
      expect(tx).not.toHaveProperty("hasTransparentInputs");

      const rawOut: AccountRaw = { ...raw };
      assignToAccountRaw(account, rawOut);

      const [out] = (rawOut as ZcashAccountRaw).privateInfo?.transactions ?? [];
      expect(out).not.toHaveProperty("transparentOut");
      expect(out).not.toHaveProperty("hasTransparentInputs");
    });
  });

  it("does not throw and leaves privateInfo undefined when the account has no shielded data yet", () => {
    const raw = makeBitcoinShapedAccountRaw();
    const account = { id: raw.id, currency: { id: "zcash" } } as unknown as Account;

    assignFromAccountRaw(raw, account);

    expect((account as unknown as ZcashAccount).privateInfo).toBeUndefined();
  });
});
