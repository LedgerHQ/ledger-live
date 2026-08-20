import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type {
  GenericTransaction,
  GenericTransactionRaw,
} from "../../bridge/generic-coin-framework/types";

/**
 * `families/hedera/types.ts` re-exports coin-hedera's *legacy* `Transaction`/`TransactionRaw`
 * (`properties.stakingNodeId`, `memo`, `maxFee`) — the wrong shape for this path. This file targets
 * `GenericTransaction` directly instead of adding a parallel local type: nothing here predates the
 * generic framework the way tezos/stellar/evm's own local types do, so there is nothing to keep
 * compatible with.
 */
export function formatTransaction(transaction: GenericTransaction, account: Account): string {
  const amount = formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
    showCode: true,
    disableRounding: true,
  });
  return `${(transaction.mode ?? "send").toUpperCase()} ${amount}\nTO ${transaction.recipient}`;
}

export function fromTransactionRaw(tr: GenericTransactionRaw): GenericTransaction {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    assetReference: tr.assetReference ?? undefined,
    assetOwner: tr.assetOwner ?? undefined,
    valId: tr.valId,
  };
}

export function toTransactionRaw(t: GenericTransaction): GenericTransactionRaw {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    fees: t.fees ? t.fees.toString() : null,
    assetReference: t.assetReference ?? null,
    assetOwner: t.assetOwner ?? null,
    valId: t.valId,
  };
}

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
