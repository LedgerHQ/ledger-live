import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  mergeOps,
  type AccountShapeInfo,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { AccountLayerDependencies } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { deduplicateOperations } from "@ledgerhq/wallet-btc/operations";
import {
  getNetworkParameters,
  type BitcoinOperationDetails,
  type BitcoinTxDetails,
} from "@ledgerhq/coin-bitcoin/api";
import type {
  BitcoinAccount,
  BitcoinAccountAddress,
  BitcoinAccountState,
  BtcOperation,
} from "../types";
import type { BitcoinDeviceSigner } from "../signer";
import {
  CHANGE_CHAIN,
  RECEIVE_CHAIN,
  accountPathFrom,
  addressDeriver,
  addressPath,
  toWalletDerivationMode,
} from "./derivation";
import { displayAddress, txToOperations } from "./interpret";
import { emptyAccountState, migrateWalletAccount, readAccountState } from "./state";
import { applyConfirmedTxs, reconcile, withMempool } from "./utxos";

/** Unused addresses walked past the last used one, per chain (BIP44). */
export const GAP = 20;

/**
 * Blocks re-read below the last synced tip: a transaction of a block replaced since must not be
 * missed, and the overlap is harmless (operations and UTXOs are keyed).
 */
export const REWIND_BLOCKS = 6;

type SyncDependencies = AccountLayerDependencies & {
  signerContext: SignerContext<BitcoinDeviceSigner>;
};

async function fetchXpub(
  signerContext: SignerContext<BitcoinDeviceSigner>,
  deviceId: string | undefined,
  currencyId: string,
  accountPath: string,
): Promise<string> {
  if (deviceId === undefined || deviceId === null) {
    throw new Error("deviceId required to generate the xpub");
  }
  const xpubVersion = getNetworkParameters(currencyId).xpubVersion.readUInt32BE(0);
  return signerContext(deviceId, signer =>
    signer.getWalletXpub({ currencyId, path: accountPath, xpubVersion }),
  );
}

/** Every transaction of an address from `minHeight`, mempool included, confirmed preferred. */
async function fetchAddressTxs(
  { api, context }: AccountLayerDependencies,
  address: string,
  minHeight: number,
): Promise<BitcoinTxDetails[]> {
  const byId = new Map<string, BitcoinTxDetails>();
  let cursor: string | undefined;
  do {
    const page = await api.listOperations(context, address, {
      minHeight,
      order: "asc",
      ...(cursor ? { cursor } : {}),
    });
    for (const op of page.items) {
      const { tx } = op.details as BitcoinOperationDetails;
      const known = byId.get(tx.id);
      if (!known || (!known.block && tx.block)) byId.set(tx.id, tx);
    }
    const next = page.next || undefined;
    cursor = next && next !== cursor ? next : undefined;
  } while (cursor);
  return [...byId.values()];
}

async function isReorged(
  { api, context }: AccountLayerDependencies,
  anchor: NonNullable<BitcoinAccountState["anchor"]>,
): Promise<boolean> {
  try {
    const block = await api.getBlockInfo(context, anchor.height);
    return block.hash !== anchor.hash;
  } catch (error) {
    // Unknown is not a reorg: a failing lookup must not wipe the account.
    log("bitcoin/accountLayer", "reorg check skipped", { error });
    return false;
  }
}

const highestBlock = (
  anchor: BitcoinAccountState["anchor"],
  txs: BitcoinTxDetails[],
): BitcoinAccountState["anchor"] =>
  txs.reduce<BitcoinAccountState["anchor"]>(
    (best, tx) =>
      tx.block && (!best || tx.block.height > best.height)
        ? { height: tx.block.height, hash: tx.block.hash }
        : best,
    anchor,
  );

/** An account still carrying the legacy bridge's transaction store is converted, not resynced. */
function legacyState(account: BitcoinAccount | undefined): BitcoinAccountState | undefined {
  const walletAccount = account?.bitcoinResources?.walletAccount;
  if (!walletAccount) return undefined;
  return migrateWalletAccount(
    {
      params: walletAccount.params,
      xpub: { xpub: walletAccount.xpub.xpub, data: walletAccount.xpub.storage.exportSync() },
    },
    account.blockHeight ?? 0,
  );
}

/**
 * Account shape of a bitcoin-like account: an extended public key whose history is spread on the
 * addresses of two chains, discovered by walking a gap limit. The coin module is asked address by
 * address; this function owns everything that needs the whole account (ADR-065).
 */
export async function getAccountShape(
  info: AccountShapeInfo,
  { api, context, signerContext }: SyncDependencies,
): Promise<Partial<BitcoinAccount>> {
  const { currency, index, derivationPath, derivationMode, deviceId } = info;
  const initialAccount = info.initialAccount as BitcoinAccount | undefined;
  const accountPath = accountPathFrom(derivationPath, index);

  // The account is keyed on its xpub, as the legacy bridge keyed it (ADR-054 §1).
  const xpub = initialAccount
    ? decodeAccountId(initialAccount.id).xpubOrAddress
    : await fetchXpub(signerContext, deviceId, currency.id, accountPath);
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: xpub,
    derivationMode,
  });
  const derive = addressDeriver(currency.id, toWalletDerivationMode(derivationMode), xpub);
  const dependencies = { api, context };

  let state =
    readAccountState(initialAccount?.bitcoinResources?.accountState) ??
    legacyState(initialAccount) ??
    emptyAccountState();
  let oldOperations = (initialAccount?.operations ?? []) as BtcOperation[];

  const tip = await api.lastBlock(context);
  if (state.anchor && (await isReorged(dependencies, state.anchor))) {
    log("bitcoin/accountLayer", `reorg below ${state.anchor.height}, syncing ${accountId} again`);
    state = emptyAccountState();
    oldOperations = [];
  }
  const fromHeight = state.syncedHeight > 0 ? Math.max(0, state.syncedHeight - REWIND_BLOCKS) : 0;

  const known = new Map(state.addresses.map(a => [a.address, a]));
  const discovered: BitcoinAccountAddress[] = [];
  const fetched = new Map<string, BitcoinTxDetails>();

  const walkChain = async (chain: 0 | 1): Promise<void> => {
    for (let start = 0; ; start += GAP) {
      const used = await Promise.all(
        Array.from({ length: GAP }, async (_, offset) => {
          const addressIndex = start + offset;
          const address = await derive(chain, addressIndex);
          const isKnown = known.has(address);
          const txs = await fetchAddressTxs(dependencies, address, isKnown ? fromHeight : 0);
          if (!isKnown && txs.length > 0) discovered.push({ address, chain, index: addressIndex });
          for (const tx of txs) {
            const previous = fetched.get(tx.id);
            if (!previous || (!previous.block && tx.block)) fetched.set(tx.id, tx);
          }
          return isKnown || txs.length > 0;
        }),
      );
      if (!used.some(Boolean)) return;
    }
  };
  await Promise.all([walkChain(RECEIVE_CHAIN), walkChain(CHANGE_CHAIN)]);

  const addresses = [...state.addresses, ...discovered];
  const own = new Set(addresses.map(a => a.address));
  const change = new Set(addresses.filter(a => a.chain === CHANGE_CHAIN).map(a => a.address));

  const txs = [...fetched.values()];
  const confirmedTxs = txs.filter(tx => tx.block);
  const pendingTxs = txs.filter(tx => !tx.block);

  const newOperations = deduplicateOperations(
    txs.flatMap(tx => txToOperations(tx, currency.id, accountId, own, change)),
  );
  const merged = mergeOps(oldOperations, newOperations) as BtcOperation[];
  const confirmedUtxos = applyConfirmedTxs(state.confirmedUtxos, confirmedTxs, own);
  const { operations, utxos } = reconcile(
    merged,
    withMempool(confirmedUtxos, pendingTxs, own),
    currency.id,
    change,
  );
  const balance = utxos.reduce((total, utxo) => total.plus(utxo.value), new BigNumber(0));

  const freshAddressIndex = addresses
    .filter(a => a.chain === RECEIVE_CHAIN)
    .reduce((next, a) => Math.max(next, a.index + 1), 0);
  const freshAddress = displayAddress(currency.id, await derive(RECEIVE_CHAIN, freshAddressIndex));

  const accountState: BitcoinAccountState = {
    version: state.version,
    syncedHeight: tip.height,
    anchor: highestBlock(state.anchor, confirmedTxs),
    addresses,
    confirmedUtxos,
  };

  return {
    id: accountId,
    xpub,
    balance,
    spendableBalance: balance,
    operations,
    operationsCount: operations.length,
    freshAddress,
    freshAddressPath: addressPath(accountPath, RECEIVE_CHAIN, freshAddressIndex),
    blockHeight: tip.height,
    bitcoinResources: { utxos, accountState },
  };
}
