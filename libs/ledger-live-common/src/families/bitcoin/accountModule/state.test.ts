import type { SerializedAccount } from "@ledgerhq/wallet-btc/account";
import {
  UTXO_ACCOUNT_STATE_VERSION,
  emptyState,
  readState,
  versioned,
} from "@ledgerhq/account-module-utxo";
import { migrateWalletAccount, readAccountState, readBitcoinState } from "./state";

const emptyAccountState = () => versioned(emptyState());

const walletAccount = (txs: unknown[], extra: Record<string, unknown> = {}): SerializedAccount =>
  ({
    params: {
      path: "84'/0'",
      index: 0,
      currency: "bitcoin",
      network: "mainnet",
      derivationMode: "Native SegWit",
    },
    xpub: { xpub: "xpub", data: { txs, addressCache: {}, ...extra } },
  }) as unknown as SerializedAccount;

const walletTx = (overrides: Record<string, unknown>) => ({
  id: "t",
  account: 0,
  index: 0,
  address: "me0",
  received_at: "2026-01-01T00:00:00Z",
  block: { height: 100, hash: "h100", time: "2026-01-01T00:00:00Z" },
  inputs: [],
  outputs: [],
  fees: 10,
  ...overrides,
});

describe("readAccountState", () => {
  it("accepts a state the UTXO account module trusts only", () => {
    expect(readAccountState(emptyAccountState())).toEqual(emptyAccountState());
    expect(readAccountState(undefined)).toBeUndefined();
    expect(
      readAccountState({ ...emptyAccountState(), version: UTXO_ACCOUNT_STATE_VERSION + 1 }),
    ).toBeUndefined();
    expect(readAccountState({ version: 1, syncedHeight: 1, addresses: [] })).toBeUndefined();
  });

  it("keeps a state Ledger Wallet persisted in version 1: the module reads it, never refreshed", () => {
    const { refreshedAt: _, ...data } = { ...emptyState(), syncedHeight: 120 };
    const persisted = { version: 1, data };

    expect(readAccountState(persisted)).toBe(persisted);
    expect(readState(readAccountState(persisted))).toEqual({
      ...emptyState(),
      syncedHeight: 120,
      refreshedAt: 0,
    });
  });
});

describe("migrateWalletAccount", () => {
  it("rebuilds addresses, confirmed UTXOs and the reorg anchor from the legacy store", () => {
    const funding = walletTx({
      id: "fund",
      account: 0,
      index: 0,
      address: "me0",
      outputs: [
        {
          value: "1000",
          address: "me0",
          output_hash: "fund",
          output_index: 0,
          block_height: 100,
          rbf: false,
        },
        {
          value: "500",
          address: "change0",
          output_hash: "fund",
          output_index: 1,
          block_height: 100,
          rbf: false,
        },
      ],
    });
    // the same transaction, stored a second time for the change address
    const fundingSeenFromChange = { ...funding, account: 1, index: 0, address: "change0" };
    const spending = walletTx({
      hash: "spend",
      id: undefined,
      account: 0,
      index: 0,
      address: "me0",
      block: { height: 120, hash: "h120", time: "2026-01-02T00:00:00Z" },
      inputs: [
        { value: "1000", address: "me0", output_hash: "fund", output_index: 0, sequence: 0 },
      ],
      outputs: [
        {
          value: "990",
          address: "ext",
          output_hash: "spend",
          output_index: 0,
          block_height: 120,
          rbf: true,
        },
      ],
    });
    const pending = walletTx({
      id: "mempool",
      block: null,
      outputs: [
        {
          value: "7",
          address: "me0",
          output_hash: "mempool",
          output_index: 0,
          block_height: null,
          rbf: false,
        },
      ],
    });
    const coinbase = walletTx({
      id: "cb",
      account: 2,
      address: "odd",
      fees: undefined,
      inputs: [
        {
          value: undefined,
          output_hash: "0000000000000000000000000000000000000000000000000000000000000000",
          output_index: 0,
          sequence: 0xffffffff,
        },
      ],
      outputs: [
        {
          value: undefined,
          address: undefined,
          output_hash: "cb",
          output_index: 0,
          block_height: 1,
          rbf: false,
        },
      ],
    });

    const state = migrateWalletAccount(
      walletAccount([funding, fundingSeenFromChange, spending, pending, coinbase]),
      130,
    );

    expect(state.version).toBe(UTXO_ACCOUNT_STATE_VERSION);
    expect(state.data.syncedHeight).toBe(130);
    // Never refreshed by the account module: its next sync is.
    expect(state.data.refreshedAt).toBe(0);
    expect(state.data.anchor).toEqual({ height: 120, hash: "h120" });
    expect(state.data.addresses).toEqual([
      { address: "me0", chain: 0, index: 0 },
      { address: "change0", chain: 1, index: 0 },
    ]);
    const unspent = [
      { txid: "fund", vout: 1, value: "500", address: "change0", height: 100, replaceable: false },
    ];
    expect(state.data.confirmedUtxos).toEqual(unspent);
    expect(state.data.utxos).toEqual(unspent);
  });

  it("gives an empty state for a store without transactions", () => {
    expect(migrateWalletAccount(walletAccount([]), 0)).toEqual(emptyAccountState());
    expect(
      migrateWalletAccount(
        { ...walletAccount([]), xpub: { xpub: "x", data: {} } } as SerializedAccount,
        5,
      ),
    ).toEqual(versioned({ ...emptyState(), syncedHeight: 5 }));
    expect(
      migrateWalletAccount(
        { ...walletAccount([]), xpub: undefined } as unknown as SerializedAccount,
        0,
      ),
    ).toEqual(emptyAccountState());
  });
});

describe("readBitcoinState", () => {
  const inMemoryWalletAccount = (txs: unknown[]) => {
    const { params, xpub } = walletAccount(txs);
    return { params, xpub: { xpub: xpub.xpub, storage: { exportSync: () => xpub.data } } };
  };

  it("reads the persisted state, or none", () => {
    const accountState = emptyAccountState();
    expect(readBitcoinState({ bitcoinResources: { utxos: [], accountState } } as never)).toBe(
      accountState,
    );
    expect(readBitcoinState({ bitcoinResources: { utxos: [] } } as never)).toBeUndefined();
    expect(readBitcoinState(undefined)).toBeUndefined();
  });

  it("converts the legacy store an account still carries, at its synced height or from 0", () => {
    const funding = walletTx({
      outputs: [{ output_hash: "t", output_index: 0, value: "1000", address: "me0" }],
    });
    const withHeight = readBitcoinState({
      blockHeight: 150,
      bitcoinResources: { utxos: [], walletAccount: inMemoryWalletAccount([funding]) },
    } as never);
    expect(withHeight).toMatchObject({ data: { syncedHeight: 150 } });
    expect(
      readBitcoinState({
        bitcoinResources: { utxos: [], walletAccount: inMemoryWalletAccount([funding]) },
      } as never),
    ).toMatchObject({ data: { syncedHeight: 0 } });
  });
});
