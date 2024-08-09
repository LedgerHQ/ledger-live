import { BigNumber } from "bignumber.js";
import type { Account, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { Horizon, StrKey } from "@stellar/stellar-sdk";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import { BASE_RESERVE, BASE_RESERVE_MIN_COUNT, fetchBaseFee, fetchSigners } from "../network";
import type {
  BalanceAsset,
  RawOperation,
  StellarOperation,
  Transaction,
  TransactionRaw,
} from "../types";

export const STELLAR_BURN_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

const currency = getCryptoCurrencyById("stellar");

const getMinimumBalance = (account: Horizon.ServerApi.AccountRecord): BigNumber => {
  return parseCurrencyUnit(currency.units[0], getReservedBalance(account).toString());
};

export async function getAccountSpendableBalance(
  balance: BigNumber,
  account: Horizon.ServerApi.AccountRecord,
): Promise<BigNumber> {
  const minimumBalance = getMinimumBalance(account);
  const { recommendedFee } = await fetchBaseFee();
  return BigNumber.max(balance.minus(minimumBalance).minus(recommendedFee), 0);
}

export function getAmountValue(
  account: Account,
  transaction: Transaction,
  fees: BigNumber,
): BigNumber {
  // Asset
  if (transaction.subAccountId) {
    const asset = findSubAccountById(account, transaction.subAccountId) as TokenAccount;
    return transaction.useAllAmount ? new BigNumber(asset.spendableBalance) : transaction.amount;
  }

  // Native
  return transaction.useAllAmount && transaction.networkInfo
    ? BigNumber.max(account.spendableBalance.minus(fees), 0)
    : transaction.amount;
}

export function getReservedBalance(account: Horizon.ServerApi.AccountRecord): BigNumber {
  const numOfSponsoringEntries = Number(account.num_sponsoring);
  const numOfSponsoredEntries = Number(account.num_sponsored);

  const nativeAsset = account.balances?.find(b => b.asset_type === "native") as BalanceAsset;

  const amountInOffers = new BigNumber(nativeAsset?.selling_liabilities || 0);
  const numOfEntries = new BigNumber(account.subentry_count || 0);

  return new BigNumber(BASE_RESERVE_MIN_COUNT)
    .plus(numOfEntries)
    .plus(numOfSponsoringEntries)
    .minus(numOfSponsoredEntries)
    .times(BASE_RESERVE)
    .plus(amountInOffers);
}

export function getOperationType(operation: RawOperation, addr: string): OperationType {
  switch (operation.type) {
    case "create_account":
      return operation.funder === addr ? "OUT" : "IN";

    case "payment":
      if (operation.from === addr && operation.to !== addr) {
        return "OUT";
      }

      return "IN";

    case "path_payment_strict_send":
      if (operation.to === addr) return "IN";
      return "OUT";

    case "path_payment_strict_receive":
      return "IN";

    case "change_trust":
      if (new BigNumber(operation.limit).eq(0)) {
        return "OPT_OUT";
      }

      return "OPT_IN";

    default:
      if (operation.source_account === addr) {
        return "OUT";
      }

      return "IN";
  }
}

export function getAssetCodeIssuer(tr: Transaction | TransactionRaw): string[] {
  if (tr.subAccountId) {
    const assetString = tr.subAccountId.split("+")[1];
    return assetString.split(":");
  }

  return [tr.assetCode || "", tr.assetIssuer || ""];
}

function getRecipients(operation: RawOperation): string[] {
  switch (operation.type) {
    case "create_account":
      return [operation.account];

    case "payment":
      return [operation.to_muxed || operation.to];

    case "path_payment_strict_send":
      return [operation.to];

    default:
      return [];
  }
}

export async function formatOperation(
  rawOperation: RawOperation,
  accountId: string,
  addr: string,
): Promise<StellarOperation> {
  const transaction = await rawOperation.transaction();
  const type = getOperationType(rawOperation, addr);
  const value = getValue(rawOperation, transaction, type);
  const recipients = getRecipients(rawOperation);
  const memo = transaction.memo
    ? transaction.memo_type === "hash" || transaction.memo_type === "return"
      ? Buffer.from(transaction.memo, "base64").toString("hex")
      : transaction.memo
    : null;

  const operation: StellarOperation = {
    id: encodeOperationId(accountId, rawOperation.transaction_hash, type),
    accountId,
    fee: new BigNumber(transaction.fee_charged),
    value: rawOperation?.asset_code ? new BigNumber(transaction.fee_charged) : value,
    // Using type NONE to hide asset operations from the main account (show them
    // only on sub-account)
    type: rawOperation?.asset_code && !["OPT_IN", "OPT_OUT"].includes(type) ? "NONE" : type,
    hash: rawOperation.transaction_hash,
    blockHeight: transaction.ledger_attr,
    date: new Date(rawOperation.created_at),
    senders: [rawOperation.source_account],
    recipients,
    transactionSequenceNumber: Number(transaction.source_account_sequence),
    hasFailed: !rawOperation.transaction_successful,
    blockHash: null,
    extra: {
      ledgerOpType: type,
    },
  };

  if (rawOperation.paging_token) {
    operation.extra.pagingToken = rawOperation.paging_token;
  }
  if (rawOperation.asset_code) {
    operation.extra.assetCode = rawOperation.asset_code;
    operation.extra.assetAmount = rawOperation.asset_code ? value.toString() : undefined;
  }
  if (rawOperation.asset_issuer) {
    operation.extra.assetIssuer = rawOperation.asset_issuer;
  }
  if (memo) {
    operation.extra.memo = memo;
  }

  return operation;
}

function getValue(
  operation: RawOperation,
  transaction: Horizon.ServerApi.TransactionRecord,
  type: OperationType,
): BigNumber {
  let value = new BigNumber(0);

  if (!operation.transaction_successful) {
    return type === "IN" ? value : new BigNumber(transaction.fee_charged || 0);
  }

  switch (operation.type) {
    case "create_account":
      value = parseCurrencyUnit(currency.units[0], operation.starting_balance);

      if (type === "OUT") {
        value = value.plus(transaction.fee_charged);
      }

      return value;

    case "payment":
    case "path_payment_strict_send":
    case "path_payment_strict_receive":
      return parseCurrencyUnit(currency.units[0], operation.amount);

    default:
      return type !== "IN" ? new BigNumber(transaction.fee_charged) : value;
  }
}

export function isMemoValid(memoType: string, memoValue: string): boolean {
  switch (memoType) {
    case "MEMO_TEXT":
      if (memoValue.length > 28) {
        return false;
      }

      break;

    case "MEMO_ID":
      if (new BigNumber(memoValue.toString()).isNaN()) {
        return false;
      }

      break;

    case "MEMO_HASH":
    case "MEMO_RETURN":
      if (!memoValue.length || memoValue.length !== 64) {
        return false;
      }

      break;
  }

  return true;
}

export async function isAccountMultiSign(account: Account): Promise<boolean> {
  const signers = await fetchSigners(account);
  return signers.length > 1;
}

/**
 * Returns true if address is valid, false if it's invalid (can't parse or wrong checksum)
 *
 * @param {*} address
 */
export function isAddressValid(address: string): boolean {
  if (!address) return false;

  // FIXME Workaround for burn address, see https://ledgerhq.atlassian.net/browse/LIVE-4014
  if (address === STELLAR_BURN_ADDRESS) return false;

  try {
    return StrKey.isValidEd25519PublicKey(address) || StrKey.isValidMed25519PublicKey(address);
  } catch (err) {
    return false;
  }
}

export function rawOperationsToOperations(
  operations: RawOperation[],
  addr: string,
  accountId: string,
): Promise<StellarOperation[]> {
  const supportedOperationTypes = [
    "create_account",
    "payment",
    "path_payment_strict_send",
    "path_payment_strict_receive",
    "change_trust",
  ];

  return Promise.all(
    operations
      .filter(operation => {
        return (
          operation.from === addr ||
          operation.to === addr ||
          operation.funder === addr ||
          operation.account === addr ||
          operation.trustor === addr ||
          operation.source_account === addr
        );
      })
      .filter(operation => supportedOperationTypes.includes(operation.type))
      .map(operation => formatOperation(operation, accountId, addr)),
  );
}
