import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge, MaxSpendableFilters } from "@ledgerhq/types-live";
import type { ZcashContext } from "../config";
import BigNumber from "bignumber.js";
import type { Transaction, ZcashAccount, ZcashTransferType } from "../types/bridge";
import {
  estimateMaxSpendableAmount,
  estimateMaxSpendableTransparent,
  marginalFeeFor,
} from "../logic/coin-selection";
import { UnsupportedMaxSpendableFilter } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  boundTransparentUtxos,
  excludePendingInputs,
  isTransparentInputTransfer,
  resolveTransparentUtxos,
} from "./statusHelpers";
import { getReservedNullifiers } from "./note-reservation";
import { collectSelectableIronwoodNotes } from "../logic/account/spendability";
import { IRONWOOD_POOL, TRANSPARENT_POOL } from "./accountBalances";

/**
 * The one pool a filtered request funds the transaction from: `pools[0]`, else the Ironwood pool
 * for a private request and the transparent pool for a public one. Several pools, an unknown pool
 * and a `private` flag that contradicts the pool are refused.
 */
/** The pool a `private` flag alone selects: Ironwood for private funds, transparent otherwise. */
function poolOfPrivateFlag(isPrivate: boolean | undefined): string | undefined {
  if (isPrivate === undefined) return undefined;
  return isPrivate ? IRONWOOD_POOL : TRANSPARENT_POOL;
}

export function resolveFilteredPool({
  pools,
  private: isPrivate,
}: MaxSpendableFilters): string | undefined {
  if (pools !== undefined && pools.length !== 1) {
    throw new UnsupportedMaxSpendableFilter(`Expected exactly one pool, got ${pools.length}`);
  }
  const pool = pools?.[0] ?? poolOfPrivateFlag(isPrivate);
  if (pool === undefined) return undefined;
  if (pool !== TRANSPARENT_POOL && pool !== IRONWOOD_POOL) {
    throw new UnsupportedMaxSpendableFilter(`Unknown pool "${pool}"`);
  }
  if (isPrivate !== undefined && isPrivate !== (pool === IRONWOOD_POOL)) {
    throw new UnsupportedMaxSpendableFilter(
      `Pool "${pool}" is ${pool === IRONWOOD_POOL ? "private" : "public"}`,
    );
  }
  return pool;
}

/** The transfers each pool can fund, by the destination they pay. */
const TRANSPARENT_FUNDED_TYPES: ZcashTransferType[] = ["transparent", "transparent-to-shielded"];
const IRONWOOD_FUNDED_TYPES: ZcashTransferType[] = ["shielded-to-transparent", "shielded"];

/**
 * The transfer types a filtered estimate is priced as: the given transaction's own type when the
 * selected pool funds it, so its destination's fee applies; else every type the pool funds, since
 * the destination is unknown.
 */
function pricedTransferTypes(
  poolTypes: ZcashTransferType[],
  transaction: Transaction | null | undefined,
): ZcashTransferType[] {
  return transaction && poolTypes.includes(transaction.transferType)
    ? [transaction.transferType]
    : poolTypes;
}

/** The lowest of the estimates: the max that holds whichever destination follows. */
const smallestOf = (estimates: BigNumber[]): BigNumber => BigNumber.min(...estimates);

export const buildEstimateMaxSpendable =
  (context: ZcashContext): AccountBridge<Transaction, ZcashAccount>["estimateMaxSpendable"] =>
  async ({ account, parentAccount, transaction, filters }) => {
    const mainAccount = getMainAccount(account, parentAccount) as ZcashAccount;
    const tx = transaction;
    const { zip2009 } = await context.config(mainAccount.currency.id);
    const marginalFee = marginalFeeFor(mainAccount, zip2009);

    // A filtered request names the pool itself; the transaction, if any, does not pick it.
    const pool = filters && resolveFilteredPool(filters);
    if (pool === TRANSPARENT_POOL) {
      // Outputs a pending operation already spends are not available to a transaction.
      const utxos = boundTransparentUtxos(
        excludePendingInputs(mainAccount, mainAccount.bitcoinResources?.utxos ?? []),
      );
      const values = utxos.map(utxo => utxo.value);
      return smallestOf(
        pricedTransferTypes(TRANSPARENT_FUNDED_TYPES, tx).map(type =>
          estimateMaxSpendableTransparent(values, type, marginalFee),
        ),
      );
    }
    if (pool === IRONWOOD_POOL) {
      const notes = collectSelectableIronwoodNotes(mainAccount, getReservedNullifiers(mainAccount));
      return smallestOf(
        pricedTransferTypes(IRONWOOD_FUNDED_TYPES, tx).map(type =>
          estimateMaxSpendableAmount(notes, type, marginalFee),
        ),
      );
    }

    if (tx && isTransparentInputTransfer(tx.transferType)) {
      const utxoValues = resolveTransparentUtxos(mainAccount, tx).map(utxo => utxo.value);
      return estimateMaxSpendableTransparent(utxoValues, tx.transferType, marginalFee);
    }

    const transferType = tx?.transferType ?? "transparent";
    // Max spendable from the Ironwood note pool for shielded-input flows.
    if (transferType !== "shielded" && transferType !== "shielded-to-transparent") {
      // No transaction to resolve a caller override through -- bound the
      // account-synced set directly so this path can never disagree with
      // resolveTransparentUtxos's bound above.
      const utxoValues = boundTransparentUtxos(mainAccount.bitcoinResources?.utxos ?? []).map(
        utxo => utxo.value,
      );
      return estimateMaxSpendableTransparent(utxoValues, "transparent", marginalFee);
    }

    const notes = collectSelectableIronwoodNotes(mainAccount, getReservedNullifiers(mainAccount));
    return estimateMaxSpendableAmount(notes, transferType, marginalFee);
  };
