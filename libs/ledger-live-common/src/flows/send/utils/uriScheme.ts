import { BigNumber } from "bignumber.js";
import type { Transaction } from "../../../coin-modules/transaction-types";

/**
 * Payment fields decoded from a URI scheme (BIP-0021 / EIP-681 style via `decodeURIScheme`).
 * Callers apply the address to the recipient search field separately so the user can confirm it
 * before leaving the recipient step
 */
export type DecodedURISchemePayment = {
  address: string;
  currency?: unknown;
  amount?: BigNumber;
  [key: string]: unknown;
};

type AllowedDecodedBigNumberField = "userGasLimit" | "gasPrice";
type AllowedTransactionBigNumberField = "customGasLimit" | "gasPrice";

const ALLOWED_TRANSACTION_BIG_NUMBER_FIELDS = new Map<
  AllowedDecodedBigNumberField,
  {
    transactionField: AllowedTransactionBigNumberField;
    isSupported: (transaction: Transaction) => boolean;
  }
>([
  [
    "userGasLimit",
    {
      transactionField: "customGasLimit",
      isSupported: transaction =>
        transaction.family === "evm" && BigNumber.isBigNumber(transaction.gasLimit),
    },
  ],
  [
    "gasPrice",
    {
      transactionField: "gasPrice",
      isSupported: transaction =>
        transaction.family === "evm" &&
        transaction.type !== 2 &&
        "gasPrice" in transaction &&
        BigNumber.isBigNumber(transaction.gasPrice),
    },
  ],
]);

/**
 * Builds a transaction patch from a decoded payment URI.
 * Applies `amount` (and clears `useAllAmount`) plus supported coin-specific fields.
 */
export function buildTransactionPatchFromURIScheme(
  transaction: Transaction,
  decoded: DecodedURISchemePayment,
): Partial<Transaction> {
  const { amount } = decoded;
  const patch: Partial<Transaction> & Partial<Record<AllowedTransactionBigNumberField, BigNumber>> =
    {};

  if (amount && BigNumber.isBigNumber(amount) && amount.isFinite() && amount.gt(0)) {
    patch.amount = amount;
    patch.useAllAmount = false;
  }

  for (const [
    decodedField,
    { transactionField, isSupported },
  ] of ALLOWED_TRANSACTION_BIG_NUMBER_FIELDS) {
    const value = decoded[decodedField];
    if (
      BigNumber.isBigNumber(value) &&
      value.isFinite() &&
      value.gte(0) &&
      isSupported(transaction)
    ) {
      patch[transactionField] = value;
    }
  }

  return patch;
}
