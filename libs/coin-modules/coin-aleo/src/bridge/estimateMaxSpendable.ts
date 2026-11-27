import BigNumber from "bignumber.js";
import type { AccountBridge, AccountLike, MaxSpendableFilters } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import {
  selectMaxSpendableRows,
  spendableOfRows,
} from "@ledgerhq/ledger-wallet-framework/account/balances";
import { UnsupportedMaxSpendableFilter } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION,
  TRANSACTION_TYPE,
} from "../constants";
import aleoCoinConfig from "../config";
import {
  findBestRecordForFee,
  isPrivateTransaction,
  selectPrivateRecordsForAmount,
} from "../logic/utils";
import type { AleoAccount, AleoTokenAccount, Transaction as AleoTransaction } from "../types";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";

/**
 * The transfer of the pool a `private` filter selects: the private records or the public balance,
 * of the token when `isToken` or else of the native asset.
 */
function transferInPool(
  transaction: AleoTransaction,
  { private: isPrivate }: MaxSpendableFilters,
  account: AccountLike<AleoAccount>,
  mainAccount: AleoAccount,
): AleoTransaction {
  if (isPrivate === undefined) return transaction;

  const isToken = account.type === "TokenAccount";
  const { properties: _properties, ...base } = transaction;
  if (isPrivate) {
    // Every record a send can spend is preselected, so the manual picking strategy, which keeps the
    // caller's selection, estimates the same maximum as the automatic one.
    const records = selectPrivateRecordsForAmount({
      unspentRecords: isToken
        ? ((account as AleoTokenAccount).unspentPrivateRecords ?? [])
        : (mainAccount.aleoResources?.unspentPrivateRecords ?? []),
      targetAmount: null,
      maxRecords: isToken
        ? MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION
        : MAX_PRIVATE_RECORDS_PER_TRANSACTION,
    });
    return {
      ...base,
      mode: isToken ? TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE : TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: records.map(record => record.commitment),
        feeRecordCommitment: null,
      },
    };
  }
  return {
    ...base,
    mode: isToken ? TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC : TRANSACTION_TYPE.TRANSFER_PUBLIC,
  };
}

/**
 * The most a private native send can move when it pays its own fee: one record covering the fee is
 * set aside first, and the amount spends the largest of the others. Zero when no record covers the fee.
 */
function privateNativeMaxWithFeeRecord(
  mainAccount: AleoAccount,
  fees: BigNumber,
): { amount: BigNumber; feeRecordValue: BigNumber } {
  const records = mainAccount.aleoResources?.unspentPrivateRecords ?? [];
  const feeRecord = findBestRecordForFee({
    unspentRecords: records,
    targetFee: fees,
    selectedAmountRecordCommitments: [],
  });
  if (!feeRecord) return { amount: new BigNumber(0), feeRecordValue: new BigNumber(0) };

  const amount = selectPrivateRecordsForAmount({
    unspentRecords: records.filter(record => record.commitment !== feeRecord.commitment),
    targetAmount: null,
    maxRecords: MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  }).reduce((sum, record) => sum.plus(record.microcredits), new BigNumber(0));
  return { amount, feeRecordValue: new BigNumber(feeRecord.microcredits) };
}

export const estimateMaxSpendable: AccountBridge<
  AleoTransaction,
  AleoAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction, filters }) => {
  // The rows of an Aleo account carry no pool: only the public / private split can be selected.
  if (filters?.pools !== undefined) {
    throw new UnsupportedMaxSpendableFilter("Aleo balances are not split into pools");
  }

  const mainAccount = getMainAccount(account, parentAccount);
  const t = transaction ?? createTransaction(mainAccount);
  const isToken = account.type === "TokenAccount";
  const base = filters ? transferInPool(t, filters, account, mainAccount) : t;

  const preparedTransaction = await prepareTransaction(mainAccount, {
    ...base,
    useAllAmount: true,
    ...(isToken && { subAccountId: account.id }),
  });

  if (!filters) return preparedTransaction.amount;

  // Funds pending operations already committed are locked on the row they spend from: the maximum
  // stays within the unlocked part of the selected row. A public native send also pays its fee from
  // that row and a token send pays it in native credits.
  const isPrivate = isPrivateTransaction(preparedTransaction);
  const rowSpendable = spendableOfRows(selectMaxSpendableRows(account, filters));
  if (!isPrivate || isToken) {
    const fees = isToken ? new BigNumber(0) : preparedTransaction.fees;
    return BigNumber.min(preparedTransaction.amount, BigNumber.max(rowSpendable.minus(fees), 0));
  }

  // A private native send pays an unsponsored fee with a record of its own, which the amount cannot
  // spend as well.
  const { isFeeSponsored } = aleoCoinConfig.getCoinConfig(mainAccount.currency.id);
  if (isFeeSponsored) return BigNumber.min(preparedTransaction.amount, rowSpendable);
  const { amount, feeRecordValue } = privateNativeMaxWithFeeRecord(
    mainAccount,
    preparedTransaction.fees,
  );
  return BigNumber.min(
    preparedTransaction.amount,
    amount,
    BigNumber.max(rowSpendable.minus(feeRecordValue), 0),
  );
};
