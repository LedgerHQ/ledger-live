import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { FEE_CURRENCY_BY_ADAPTER } from "../constants";
import { CeloAccount, CeloOperation, CeloOperationMode, Transaction } from "../types";

const MODE_TO_TYPE: { [key in CeloOperationMode | "default"]: OperationType } = {
  send: "OUT",
  lock: "LOCK",
  unlock: "UNLOCK",
  withdraw: "WITHDRAW",
  vote: "VOTE",
  revoke: "REVOKE",
  activate: "ACTIVATE",
  register: "REGISTER",
  default: "FEES",
};

/**
 * A CIP-64 fee in its token's own units, with that token's contract, as the sync reports it: the
 * estimate is in the fee currency's units, 18 decimals for an adapter (`getFeesForTransaction`).
 * `undefined` when the account holds no such token to read its decimals from.
 */
const toFeeTokenUnits = (
  account: CeloAccount,
  feeCurrency: string,
  fee: BigNumber,
): { feeAsset: string; fee: BigNumber } | undefined => {
  const contract = FEE_CURRENCY_BY_ADAPTER.get(
    feeCurrency.toLowerCase(),
  )?.contractAddress?.toLowerCase();
  const token = account.subAccounts?.find(
    sub => sub.type === "TokenAccount" && sub.token.contractAddress.toLowerCase() === contract,
  )?.token;
  const magnitude = token?.units[0]?.magnitude;
  if (!contract || magnitude === undefined || magnitude > 18) return undefined;
  return {
    feeAsset: contract,
    fee: fee.dividedBy(new BigNumber(10).pow(18 - magnitude)).integerValue(BigNumber.ROUND_FLOOR),
  };
};

/**
 * As the synced operation: the fee token, its fee in that token's units. Without the token's
 * decimals, the fee stays in the fee currency's units, flagged by the adapter.
 */
const feeExtra = (
  tokenFee: { feeAsset: string } | undefined,
  feeCurrency: string | null | undefined,
): { feeAsset: string } | { feeCurrencyAddress: string } | Record<string, never> => {
  if (tokenFee) return { feeAsset: tokenFee.feeAsset };
  if (feeCurrency) return { feeCurrencyAddress: feeCurrency.toLowerCase() };
  return {};
};

export const buildOptimisticOperation = (
  account: CeloAccount,
  transaction: Transaction,
  fee: BigNumber,
  /** What was signed: only some modes carry `transaction.feeCurrency` into the tx. */
  signed: { nonce: number; feeCurrency?: string | null | undefined },
): CeloOperation => {
  const { nonce, feeCurrency } = signed;
  const type = MODE_TO_TYPE[transaction.mode] ?? MODE_TO_TYPE.default;

  const tokenAccount = findSubAccountById(account, transaction.subAccountId || "");
  const isTokenTransaction = tokenAccount?.type === "TokenAccount";

  // A CIP-64 fee is charged in the fee currency, so it is not CELO spent.
  const isFeePaidInCelo = !isTokenTransaction && !feeCurrency;
  const celoFee = isFeePaidInCelo ? fee : 0;
  const tokenFee = feeCurrency ? toFeeTokenUnits(account, feeCurrency, fee) : undefined;
  const value =
    type === "OUT" || type === "LOCK"
      ? new BigNumber(transaction.amount).plus(celoFee)
      : new BigNumber(transaction.amount);

  const operation: CeloOperation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee: tokenFee?.fee ?? fee,
    blockHash: null,
    blockHeight: null,
    // Lets the pending op clear as soon as a synced op carries the same nonce.
    transactionSequenceNumber: new BigNumber(nonce),
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: isTokenTransaction ? tokenAccount.id : account.id,
    date: new Date(),
    extra: {
      ...(["ACTIVATE", "VOTE", "REVOKE"].includes(type)
        ? {
            celoOperationValue: new BigNumber(transaction.amount),
            celoSourceValidator: transaction.recipient,
          }
        : {}),
      ...feeExtra(tokenFee, feeCurrency),
    },
  };

  return operation;
};
