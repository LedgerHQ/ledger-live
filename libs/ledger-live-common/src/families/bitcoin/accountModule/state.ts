import type { Versioned } from "@ledgerhq/account-module-framework";
import {
  UTXO_ACCOUNT_STATE_VERSION,
  applyTransactions,
  readState,
  type UtxoAccountState,
  type UtxoAddressState,
  type UtxoTransaction,
} from "@ledgerhq/account-module-utxo";
import type { Account } from "@ledgerhq/types-live";
import type { SerializedAccount as WalletAccountRaw } from "@ledgerhq/wallet-btc/account";
import type { TX as WalletTx } from "@ledgerhq/wallet-btc/storage/types";
import type { BitcoinAccount } from "../types";
import { CHANGE_CHAIN, RECEIVE_CHAIN } from "./derivation";

/** BIP125: an input below this nSequence signals replaceability. */
const RBF_SEQUENCE_THRESHOLD = 0xfffffffe;
const COINBASE_PREVIOUS = /^0+$/;

/** The persisted state of an account, when it is one the UTXO account module trusts. */
export const readAccountState = (state: unknown): Versioned<UtxoAccountState> | undefined =>
  readState(state as Versioned<UtxoAccountState> | undefined)
    ? (state as Versioned<UtxoAccountState>)
    : undefined;

function toUtxoTransaction(tx: WalletTx, block: NonNullable<WalletTx["block"]>): UtxoTransaction {
  return {
    id: tx.id ?? (tx.hash as string),
    receivedAt: tx.received_at,
    block: { height: block.height, hash: block.hash, time: block.time },
    fees: String(tx.fees ?? 0),
    replaceable: tx.inputs.some(input => input.sequence < RBF_SEQUENCE_THRESHOLD),
    inputs: tx.inputs.map(input => ({
      ...(input.output_hash && !COINBASE_PREVIOUS.test(input.output_hash)
        ? { txid: input.output_hash }
        : {}),
      vout: input.output_index,
      ...(input.address ? { address: input.address } : {}),
      value: String(input.value ?? 0),
      sequence: input.sequence,
    })),
    outputs: tx.outputs.map(output => ({
      index: output.output_index,
      ...(output.address ? { address: output.address } : {}),
      value: String(output.value ?? 0),
    })),
  };
}

/**
 * Converts the transaction store a legacy bridge persisted (`bitcoinResources.walletAccount`) into
 * the account module state, without a resync (ADR-065 M1): it holds every address with history and
 * every transaction of them. `syncedHeight` is the tip of the last legacy sync; mempool
 * transactions are left out, the next sync reads the mempool again.
 */
export function migrateWalletAccount(
  walletAccount: WalletAccountRaw,
  syncedHeight: number,
): Versioned<UtxoAccountState> {
  const data = walletAccount.xpub?.data as { txs?: WalletTx[] } | undefined;
  const walletTxs = Array.isArray(data?.txs) ? data.txs : [];

  const addresses = new Map<string, UtxoAddressState>();
  for (const tx of walletTxs) {
    const chain = tx.account;
    if (!addresses.has(tx.address) && (chain === RECEIVE_CHAIN || chain === CHANGE_CHAIN)) {
      addresses.set(tx.address, { address: tx.address, chain, index: tx.index });
    }
  }

  const confirmed = new Map<string, UtxoTransaction>();
  for (const tx of walletTxs) {
    if (!tx.block) continue;
    const transaction = toUtxoTransaction(tx, tx.block);
    confirmed.set(transaction.id, transaction);
  }
  const transactions = [...confirmed.values()];
  const anchor = transactions.reduce<UtxoAccountState["anchor"]>(
    (best, tx) =>
      tx.block && (!best || tx.block.height > best.height)
        ? { height: tx.block.height, hash: tx.block.hash }
        : best,
    null,
  );
  const utxos = applyTransactions([], transactions, new Set(addresses.keys()));

  return {
    version: UTXO_ACCOUNT_STATE_VERSION,
    data: {
      syncedHeight,
      anchor,
      addresses: [...addresses.values()],
      confirmedUtxos: utxos,
      utxos,
    },
  };
}

/**
 * The state of an account: the persisted one, or — for an account still carrying the legacy
 * bridge's transaction store in memory — the one converted from it, without a resync.
 */
export function readBitcoinState(
  account: Account | undefined,
): Versioned<UtxoAccountState> | undefined {
  const resources = (account as BitcoinAccount | undefined)?.bitcoinResources;
  const persisted = readAccountState(resources?.accountState);
  if (persisted || !resources?.walletAccount) return persisted;
  const { walletAccount } = resources;
  return migrateWalletAccount(
    {
      params: walletAccount.params,
      xpub: { xpub: walletAccount.xpub.xpub, data: walletAccount.xpub.storage.exportSync() },
    },
    account?.blockHeight ?? 0,
  );
}
