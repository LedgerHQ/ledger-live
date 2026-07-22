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
      utxos: [
        [
          "abcd1234",
          0,
          99,
          "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F",
          "100000",
          0,
          0,
        ],
      ],
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

  it("does not throw and leaves privateInfo undefined when the account has no shielded data yet", () => {
    const raw = makeBitcoinShapedAccountRaw();
    const account = { id: raw.id, currency: { id: "zcash" } } as unknown as Account;

    assignFromAccountRaw(raw, account);

    expect((account as unknown as ZcashAccount).privateInfo).toBeUndefined();
  });
});
