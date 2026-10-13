import type { Account } from "@ledgerhq/types-live";
import type { BitcoinTxDetails } from "@ledgerhq/coin-bitcoin/api";
import { AccountNeedResync } from "@ledgerhq/wallet-btc/errors";
import type { SerializedAccount as WalletAccountRaw } from "@ledgerhq/wallet-btc/account";
import type { TX as WalletTx } from "@ledgerhq/wallet-btc/storage/types";
import {
  BITCOIN_ACCOUNT_STATE_VERSION,
  type BitcoinAccount,
  type BitcoinAccountAddress,
  type BitcoinAccountState,
} from "../types";
import { applyConfirmedTxs } from "./utxos";

export const emptyAccountState = (): BitcoinAccountState => ({
  version: BITCOIN_ACCOUNT_STATE_VERSION,
  syncedHeight: 0,
  anchor: null,
  addresses: [],
  confirmedUtxos: [],
});

/** A state written by another version is not trusted: the account is synced again from scratch. */
export function readAccountState(state: unknown): BitcoinAccountState | undefined {
  if (!state || typeof state !== "object") return undefined;
  const candidate = state as Partial<BitcoinAccountState>;
  if (
    candidate.version !== BITCOIN_ACCOUNT_STATE_VERSION ||
    typeof candidate.syncedHeight !== "number" ||
    !Array.isArray(candidate.addresses) ||
    !Array.isArray(candidate.confirmedUtxos)
  ) {
    return undefined;
  }
  return candidate as BitcoinAccountState;
}

const confirmedTxToDetails = (
  tx: WalletTx,
  block: NonNullable<WalletTx["block"]>,
): BitcoinTxDetails => ({
  id: tx.id ?? (tx.hash as string),
  receivedAt: tx.received_at,
  block: { height: block.height, hash: block.hash, time: block.time },
  fees: String(tx.fees ?? 0),
  inputs: tx.inputs.map(input => ({
    ...(input.output_hash ? { txid: input.output_hash } : {}),
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
});

/**
 * Converts the transaction store a legacy bridge persisted (`bitcoinResources.walletAccount`) into
 * the account state, without a resync (ADR-065 M1): it holds every address with history and every
 * transaction of them, which is all the state is derived from.
 *
 * `syncedHeight` is the account's own `blockHeight` — the tip of its last legacy sync. Mempool
 * transactions are left out: the next sync reads the mempool again.
 */
export function migrateWalletAccount(
  walletAccount: WalletAccountRaw,
  syncedHeight: number,
): BitcoinAccountState {
  const data = walletAccount.xpub?.data as { txs?: WalletTx[] } | undefined;
  const walletTxs = Array.isArray(data?.txs) ? data.txs : [];

  const addresses = new Map<string, BitcoinAccountAddress>();
  for (const tx of walletTxs) {
    const chain = tx.account;
    if (!addresses.has(tx.address) && (chain === 0 || chain === 1)) {
      addresses.set(tx.address, { address: tx.address, chain, index: tx.index });
    }
  }

  const confirmed = new Map<string, BitcoinTxDetails>();
  for (const tx of walletTxs) {
    if (!tx.block) continue;
    const details = confirmedTxToDetails(tx, tx.block);
    confirmed.set(details.id, details);
  }
  const confirmedTxs = [...confirmed.values()];

  let anchor: BitcoinAccountState["anchor"] = null;
  for (const tx of confirmedTxs) {
    if (tx.block && (!anchor || tx.block.height > anchor.height)) {
      anchor = { height: tx.block.height, hash: tx.block.hash };
    }
  }

  return {
    version: BITCOIN_ACCOUNT_STATE_VERSION,
    syncedHeight,
    anchor,
    addresses: [...addresses.values()],
    confirmedUtxos: applyConfirmedTxs([], confirmedTxs, new Set(addresses.keys())),
  };
}

/**
 * The state of an account: the persisted one, or — for an account still carrying the legacy
 * bridge's transaction store in memory — the one converted from it, without a resync (M1).
 */
export function readBitcoinState(account: Account | undefined): BitcoinAccountState | undefined {
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

export const bitcoinResyncError = (): Error => new AccountNeedResync();
