import type {
  Account,
  AccountBalance,
  AccountBridge,
  MaxSpendableFilters,
  TokenAccount,
} from "@ledgerhq/types-live";
import {
  clampLocked,
  selectMaxSpendableRows,
  spendableOfRows,
} from "@ledgerhq/ledger-wallet-framework/account/balances";
import { UnsupportedMaxSpendableFilter } from "@ledgerhq/ledger-wallet-framework/errors";
import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import { getMainAccount } from "../../account";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { createTransaction } from "./createTransaction";
import {
  computeUseAllAmount,
  getNativeSpendableAfterPending,
  getPendingNativeSpent,
  getPendingTokenSpent,
  transactionToIntent,
} from "./utils";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "./types";
import { getBridgeApi } from "./bridge";

/**
 * The spendable part of the selected native rows once pending operations are taken out. Pending
 * spends sit on the account's first public row, as `extractBalances` places them, so funds in
 * other pools cannot hide them.
 */
function spendableOfNativeRows(account: Account, rows: AccountBalance[]): BigNumber {
  const pendingSpent = getPendingNativeSpent(account.pendingOperations ?? []);
  const pendingRow = (account.balances ?? []).find(row => !row.private);
  return rows.reduce((sum, row) => {
    if (row !== pendingRow) return sum.plus(spendableOfRows([row]));
    const locked = clampLocked(row.value, (row.locked ?? new BigNumber(0)).plus(pendingSpent));
    return sum.plus(row.value.minus(locked));
  }, new BigNumber(0));
}

/**
 * The one pool the selected rows belong to: a transaction spends from a single pool. A row without
 * a pool is a funding source of its own, so it cannot be combined with a named pool either.
 */
function singlePoolOf(rows: AccountBalance[]): string | undefined {
  const pools = new Set(rows.map(row => row.pool));
  if (pools.size > 1) {
    throw new UnsupportedMaxSpendableFilter("The selected balances belong to several pools");
  }
  const [pool] = pools;
  return pool;
}

/** A token account's max: its selected rows, or its spendable balance, less its pending spends. */
function tokenMaxSpendable(account: TokenAccount, filters?: MaxSpendableFilters): BigNumber {
  const pendingSpent = getPendingTokenSpent(account.pendingOperations ?? []);
  const rows = filters ? selectMaxSpendableRows(account, filters) : undefined;
  if (rows) singlePoolOf(rows);
  const spendable = rows ? spendableOfRows(rows) : account.spendableBalance;
  return BigNumber.max(0, spendable.minus(pendingSpent));
}

/** The pool and the amount a filtered native send may spend: the selected rows after pending. */
function filteredNativeFunding(
  account: Account,
  filters: MaxSpendableFilters,
): { pool: string | undefined; spendable: BigNumber } {
  const rows = selectMaxSpendableRows(account, filters);
  return {
    pool: singlePoolOf(rows),
    spendable: BigNumber.min(
      spendableOfNativeRows(account, rows),
      getNativeSpendableAfterPending(account),
    ),
  };
}

export function genericEstimateMaxSpendable(
  network: string,
  kind: string,
): AccountBridge<GenericTransaction>["estimateMaxSpendable"] {
  return async ({ account, parentAccount, transaction, filters }) => {
    if (account.type === "TokenAccount") return tokenMaxSpendable(account, filters);
    const mainAccount = getMainAccount(account, parentAccount);
    const coinModuleApi = await getCoinModuleApi(mainAccount.currency.id, kind);
    const context = buildContext(mainAccount.currency.id);
    const bridgeApi = await getBridgeApi(mainAccount.currency, network);
    const funding = filters ? filteredNativeFunding(mainAccount, filters) : undefined;
    const spendable = funding?.spendable ?? mainAccount.spendableBalance;
    const draftTransaction = {
      ...createTransaction(account),
      ...transaction,
      amount: spendable,
      useAllAmount: true,
      // A filtered estimate funds from the selected pool only, never from one the transaction names.
      ...(funding && { pool: funding.pool }),
    };

    const intent = transactionToIntent(
      mainAccount,
      draftTransaction,
      bridgeApi.computeIntentType,
      intent => coinModuleApi.craftTransactionData(context, intent),
      bridgeApi.buildIntentData,
    );
    let estimated: FeeEstimation;
    try {
      estimated = await coinModuleApi.estimateFees(context, intent);
    } catch (error) {
      // The send-max cannot be broadcast, typically because the balance does not cover its fees.
      if (!bridgeApi.validatesRefusedEstimation) throw error;
      return new BigNumber(0);
    }
    const estimation: FeeEstimation = {
      value: BigNumber.isBigNumber(transaction?.fees)
        ? BigInt(transaction.fees.toFixed())
        : estimated.value,
      parameters: BigNumber.isBigNumber(transaction?.additionalFees)
        ? { ...estimated.parameters, additionalFees: BigInt(transaction.additionalFees.toFixed()) }
        : estimated.parameters,
    };

    if (!funding) return computeUseAllAmount(estimation, getNativeSpendableAfterPending(account));
    // A coin that states the send-max amount itself is still bounded by the selected rows.
    return BigNumber.min(computeUseAllAmount(estimation, spendable), spendable);
  };
}
