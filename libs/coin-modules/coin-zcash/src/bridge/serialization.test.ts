import BigNumber from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { fromAccountRaw } from "@ledgerhq/ledger-wallet-framework/serialization";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/balanceHistoryCache";
import wallet from "@ledgerhq/wallet-btc/index";
import { assignToAccountRaw, makeAssignFromAccountRaw } from "./serialization";
import type { ZcashAccount, ZcashAccountRaw } from "../types/bridge";

// A bitcoin-shaped zcash AccountRaw, as produced today by coin-bitcoin's
// assignToAccountRaw (bitcoinResources/utxos, no walletAccount populated in
// this fixture -- see file header for why). This is the coexistence
// guarantee under test: an account synced while coin-bitcoin owned Zcash
// must still round-trip through coin-zcash's assignFromAccountRaw/
// assignToAccountRaw once the `zcashShielded` flag routes to coin-zcash.
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

const assignFromAccountRaw = makeAssignFromAccountRaw(jest.fn());

describe("bridge/serialization", () => {
  it("drops a persisted UTXO with an unreadable value", () => {
    const raw = makeBitcoinShapedAccountRaw() as ZcashAccountRaw;
    raw.bitcoinResources = {
      utxos: [
        ["abcd1234", 0, 99, "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F", "100000", 0, 0],
        ["dead0000", 1, 99, "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F", "1e1000000", 0, 0],
      ],
    } as ZcashAccountRaw["bitcoinResources"];
    const account = {
      id: raw.id,
      currency: { id: "zcash" },
      operations: [],
      operationsCount: 0,
    } as unknown as Account;

    assignFromAccountRaw(raw, account);

    const zcashAccount = account as unknown as ZcashAccount;
    expect(zcashAccount.bitcoinResources.utxos.map(u => u.hash)).toEqual(["abcd1234"]);
    expect(zcashAccount.balance).toEqual(new BigNumber(100_000));
    expect(zcashAccount.spendableBalance).toEqual(new BigNumber(100_000));
  });

  it("round-trips bitcoinResources.utxos from a bitcoin-shaped zcash AccountRaw", () => {
    const raw = makeBitcoinShapedAccountRaw();
    const account = {
      id: raw.id,
      currency: { id: "zcash" },
      operations: [],
      operationsCount: 0,
    } as unknown as Account;

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
      ironwoodBalance: "0",
      syncState: "complete",
      progress: 100,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: "ufvk1abc",
      birthday: "2016-10-28",
      shieldedAddress: null,
      lastSyncTimestamp: 123,
      lastProcessedBlock: 1000,
      transactions: [],
    };

    const account = {
      id: raw.id,
      currency: { id: "zcash" },
      operations: [],
      operationsCount: 0,
    } as unknown as Account;
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
        ironwoodBalance: "0",
        syncState: "complete",
        progress: 100,
        estimatedTimeRemaining: { hours: 0, minutes: 0 },
        ufvk: "ufvk1abc",
        birthday: "2016-10-28",
        shieldedAddress: null,
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
      const account = {
        id: raw.id,
        currency: { id: "zcash" },
        operations: [],
        operationsCount: 0,
      } as unknown as Account;

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

    it.each([
      [
        "a note",
        (raw: ZcashAccountRaw) => {
          const [tx] = raw.privateInfo?.transactions ?? [];
          tx.decryptedData?.orchard_outputs.push({
            amount: "NaN",
            memo: "",
            transfer_type: "incoming",
          });
        },
      ],
      [
        "a pool balance",
        (raw: ZcashAccountRaw) => {
          if (raw.privateInfo) raw.privateInfo.ironwoodBalance = "NaN";
        },
      ],
      [
        "no Ironwood balance next to Ironwood notes",
        (raw: ZcashAccountRaw) => {
          const [tx] = raw.privateInfo?.transactions ?? [];
          if (tx.decryptedData) {
            tx.decryptedData.ironwood_outputs = [
              { amount: "5000", memo: "", transfer_type: "incoming" },
            ];
          }
          delete (raw.privateInfo as Partial<NonNullable<ZcashAccountRaw["privateInfo"]>>)
            .ironwoodBalance;
        },
      ],
      [
        "a null Ironwood balance",
        (raw: ZcashAccountRaw) => {
          if (raw.privateInfo) raw.privateInfo.ironwoodBalance = null as unknown as string;
        },
      ],
    ])(
      "resets the shielded state for a full rescan when %s was persisted unreadable",
      (_label, poison) => {
        const raw = withTransactions([
          {
            ...rawTransaction,
            decryptedData: {
              orchard_outputs: [{ amount: "5000", memo: "", transfer_type: "incoming" }],
              sapling_outputs: [],
            },
          },
        ]);
        poison(raw);
        const account = {
          id: raw.id,
          currency: { id: "zcash" },
          operations: [],
          operationsCount: 0,
        } as unknown as Account;

        assignFromAccountRaw(raw, account);

        expect((account as unknown as ZcashAccount).privateInfo).toMatchObject({
          orchardBalance: new BigNumber(0),
          ironwoodBalance: new BigNumber(0),
          lastProcessedBlock: null,
          transactions: [],
          ufvk: "ufvk1abc",
          syncState: "ready",
          progress: 0,
        });
        expect(account.balance).toEqual(new BigNumber(100_000));
        expect(account.spendableBalance).toEqual(new BigNumber(100_000));
      },
    );

    it("reads a zero Ironwood balance on an account persisted before Ironwood support", () => {
      const raw = withTransactions([
        {
          ...rawTransaction,
          decryptedData: {
            orchard_outputs: [{ amount: "5000", memo: "", transfer_type: "incoming" }],
            sapling_outputs: [],
          },
        },
      ]);
      delete (raw.privateInfo as Partial<NonNullable<ZcashAccountRaw["privateInfo"]>>)
        .ironwoodBalance;
      const account = {
        id: raw.id,
        currency: { id: "zcash" },
        operations: [],
        operationsCount: 0,
      } as unknown as Account;

      assignFromAccountRaw(raw, account);

      expect((account as unknown as ZcashAccount).privateInfo).toMatchObject({
        ironwoodBalance: new BigNumber(0),
        lastProcessedBlock: 1000,
      });
    });

    it("drops the whole history so both legs reload it in full", () => {
      const raw = withTransactions([]);
      if (raw.privateInfo) raw.privateInfo.orchardBalance = "NaN";
      const account = {
        id: raw.id,
        currency: { id: "zcash" },
        operations: [
          { hash: "t-in", type: "IN" },
          { hash: "s-internal", type: "NONE" },
          { hash: "s-in", type: "SHIELDED_TX_IRONWOOD_IN" },
        ],
        operationsCount: 5,
      } as unknown as Account;

      assignFromAccountRaw(raw, account);

      expect(account.operations).toEqual([]);
      expect(account.operationsCount).toBe(0);
    });

    it.each([
      ["a stopped scan that failed is rescanned", "stopped", "engine down", "ready"],
      ["a scan the user paused stays paused", "stopped", null, "stopped"],
      ["a disabled shielded sync stays disabled", "disabled", null, "disabled"],
      ["a running scan is rescanned", "running", null, "ready"],
    ])("on reset, %s", (_label, syncState, lastSyncError, expected) => {
      const raw = withTransactions([]);
      if (raw.privateInfo) {
        raw.privateInfo.orchardBalance = "NaN";
        raw.privateInfo.syncState = syncState;
        raw.privateInfo.lastSyncError = lastSyncError;
      }
      const account = {
        id: raw.id,
        currency: { id: "zcash" },
        operations: [],
        operationsCount: 0,
      } as unknown as Account;

      assignFromAccountRaw(raw, account);

      expect((account as unknown as ZcashAccount).privateInfo).toMatchObject({
        syncState: expected,
        progress: 0,
        lastSyncError: null,
      });
    });

    it("repairs the account totals the shared deserialization read from a persisted unreadable note", async () => {
      const raw = withTransactions([
        {
          ...rawTransaction,
          decryptedData: {
            orchard_outputs: [],
            sapling_outputs: [],
            ironwood_outputs: [{ amount: "NaN", memo: "", transfer_type: "incoming" }],
          },
        },
      ]);
      raw.balance = "NaN";
      raw.spendableBalance = "NaN";
      raw.balances = [
        { value: "100000", pool: "transparent" },
        { value: "NaN", pool: "ironwood", private: true },
      ];

      const account = (await fromAccountRaw(raw, { assignFromAccountRaw })) as ZcashAccount;

      expect(account.balance).toEqual(new BigNumber(100_000));
      expect(account.spendableBalance).toEqual(new BigNumber(100_000));
      expect(account.balances).toEqual([
        { value: new BigNumber(100_000), locked: new BigNumber(0), pool: "transparent" },
      ]);
      expect(account.balanceHistoryCache).toEqual(emptyHistoryCache);
      expect(account.privateInfo).toMatchObject({
        ironwoodBalance: new BigNumber(0),
        lastProcessedBlock: null,
        transactions: [],
        syncState: "ready",
      });
    });

    it("forgets the cached transparent history on reset so the next sync reloads all of it", () => {
      const raw = withTransactions([]);
      if (raw.privateInfo) raw.privateInfo.orchardBalance = "NaN";
      (raw.bitcoinResources as { walletAccount?: unknown }).walletAccount = {
        params: { currency: "zcash" },
      };
      const loadSync = jest.fn();
      const cached = {
        xpub: {
          syncedBlockHeight: 100,
          storage: { exportSync: () => ({ txs: [{}], addressCache: { k: "addr" } }), loadSync },
        },
      };
      jest.spyOn(wallet, "importFromSerializedAccountSync").mockReturnValueOnce(cached as never);
      const account = {
        id: raw.id,
        currency: { id: "zcash" },
        operations: [],
        operationsCount: 0,
      } as unknown as Account;

      assignFromAccountRaw(raw, account);

      expect(loadSync).toHaveBeenCalledWith(expect.anything(), {
        txs: [],
        addressCache: { k: "addr" },
      });
      expect(cached.xpub.syncedBlockHeight).toBe(-1);
    });

    it("keeps the pending-spend lock on the transparent row of a reset account", () => {
      const raw = withTransactions([]);
      if (raw.privateInfo) raw.privateInfo.orchardBalance = "NaN";
      const account = {
        id: raw.id,
        currency: { id: "zcash" },
        operations: [],
        operationsCount: 0,
        pendingOperations: [{ extra: { inputRefs: [{ hash: "abcd1234", outputIndex: 0 }] } }],
      } as unknown as Account;

      assignFromAccountRaw(raw, account);

      expect(account.balances).toEqual([
        { value: new BigNumber(100_000), locked: new BigNumber(100_000), pool: "transparent" },
      ]);
    });

    it.each([
      ["fee", { fee: "abc" }],
      ["transparent output", { transparentOut: "" }],
    ])("rescans instead of throwing on a persisted unreadable %s", (_label, overrides) => {
      const raw = withTransactions([{ ...rawTransaction, ...overrides }]);
      const account = {
        id: raw.id,
        currency: { id: "zcash" },
        operations: [],
        operationsCount: 0,
      } as unknown as Account;

      assignFromAccountRaw(raw, account);

      expect((account as unknown as ZcashAccount).privateInfo).toMatchObject({
        lastProcessedBlock: null,
        transactions: [],
      });
    });

    it("loads a persisted transaction whose decrypted data lacks a pool array", () => {
      const raw = withTransactions([
        {
          ...rawTransaction,
          decryptedData: {
            orchard_outputs: [{ amount: "5000", memo: "", transfer_type: "incoming" }],
          },
        },
      ]);
      const account = {
        id: raw.id,
        currency: { id: "zcash" },
        operations: [],
        operationsCount: 0,
      } as unknown as Account;

      assignFromAccountRaw(raw, account);

      const info = (account as unknown as ZcashAccount).privateInfo;
      expect(info?.lastProcessedBlock).toBe(1000);
      expect(info?.transactions[0].decryptedData?.sapling_outputs).toEqual([]);
    });

    // An account persisted before the scanner reported the transparent bundle says
    // nothing about it, and must keep saying nothing: read back as zero it would
    // claim the transaction moved no transparent value, which classifies a
    // shielded→transparent send as a self-transfer.
    it("stays absent when it was never persisted", () => {
      const raw = withTransactions([rawTransaction]);
      const account = {
        id: raw.id,
        currency: { id: "zcash" },
        operations: [],
        operationsCount: 0,
      } as unknown as Account;

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
    const account = {
      id: raw.id,
      currency: { id: "zcash" },
      operations: [],
      operationsCount: 0,
    } as unknown as Account;

    assignFromAccountRaw(raw, account);

    expect(account).not.toHaveProperty("privateInfo");
  });

  describe("shieldedAddress", () => {
    it("round-trips a non-null shieldedAddress through assignToAccountRaw / assignFromAccountRaw", () => {
      const raw = makeBitcoinShapedAccountRaw() as ZcashAccountRaw;
      raw.privateInfo = {
        orchardBalance: "0",
        saplingBalance: "0",
        ironwoodBalance: "0",
        syncState: "complete",
        progress: 100,
        estimatedTimeRemaining: { hours: 0, minutes: 0 },
        ufvk: "uview1test",
        birthday: null,
        shieldedAddress: "u1testaddress",
        lastSyncTimestamp: null,
        lastProcessedBlock: null,
        transactions: [],
      };

      const account = {
        id: raw.id,
        currency: { id: "zcash" },
        operations: [],
        operationsCount: 0,
      } as unknown as Account;
      assignFromAccountRaw(raw, account);
      const rawOut = { id: raw.id } as AccountRaw;
      assignToAccountRaw(account, rawOut);

      expect((rawOut as ZcashAccountRaw).privateInfo?.shieldedAddress).toBe("u1testaddress");
    });

    it("falls back to null for accounts serialized before this field existed", () => {
      const raw = makeBitcoinShapedAccountRaw() as ZcashAccountRaw;
      // Simulate a raw account that was written before shieldedAddress was introduced.
      const legacyPrivateInfo = {
        orchardBalance: "0",
        saplingBalance: "0",
        ironwoodBalance: "0",
        syncState: "ready",
        progress: 0,
        estimatedTimeRemaining: { hours: 0, minutes: 0 },
        ufvk: "uview1test",
        birthday: null,
        lastSyncTimestamp: null,
        lastProcessedBlock: null,
        transactions: [],
        // shieldedAddress intentionally absent
      };
      raw.privateInfo = legacyPrivateInfo as unknown as NonNullable<ZcashAccountRaw["privateInfo"]>;

      const account = {
        id: raw.id,
        currency: { id: "zcash" },
        operations: [],
        operationsCount: 0,
      } as unknown as Account;
      assignFromAccountRaw(raw, account);

      expect((account as unknown as ZcashAccount).privateInfo?.shieldedAddress).toBeNull();
    });
  });
});
