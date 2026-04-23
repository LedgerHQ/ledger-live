/*
 * Serialization functions from Horizon to Ledger Live types
 */
import type { Operation } from "@ledgerhq/coin-module-framework/api/types";
import { Horizon } from "@stellar/stellar-sdk";
import BigNumber from "bignumber.js";
import type { BalanceAsset, RawOperation, StellarMemo } from "../types";
import { parseAPIValue } from "../logic/common";

// Constants
const BASE_RESERVE_MIN_COUNT = 2;
export const BASE_RESERVE = 0.5;
export const MIN_BALANCE = 1;

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

export async function rawOperationsToOperations(
  operations: RawOperation[],
  addr: string,
  accountId: string,
  minHeight: number,
): Promise<Operation[]> {
  const supportedOperationTypes = [
    "create_account",
    "payment",
    "path_payment_strict_send",
    "path_payment_strict_receive",
    "change_trust",
  ];

  const ops = await Promise.all(
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
      .map(operation => formatOperation(operation, accountId, addr, minHeight)),
  );

  return ops.filter(op => op !== undefined) as Operation[];
}

async function formatOperation(
  rawOperation: RawOperation,
  accountId: string,
  addr: string,
  minHeight: number,
): Promise<Operation | undefined> {
  const transaction = await rawOperation.transaction();

  if (transaction.ledger_attr < minHeight) return undefined;

  const { hash: blockHash, closed_at: blockTime } = await transaction.ledger();
  const type = getOperationType(rawOperation, addr);
  const value = getValue(rawOperation, transaction, type);
  const recipients = getRecipients(rawOperation);

  let memo: StellarMemo | undefined = undefined;
  switch (transaction.memo_type) {
    case "none":
      memo = { type: "NO_MEMO" };
      break;
    case "id":
      if (transaction.memo) {
        memo = { type: "MEMO_ID", value: transaction.memo };
      }
      break;
    case "text":
      if (transaction.memo) {
        memo = { type: "MEMO_TEXT", value: transaction.memo };
      }
      break;
    case "return":
      if (transaction.memo) {
        memo = {
          type: "MEMO_RETURN",
          value: Buffer.from(transaction.memo, "base64").toString("hex"),
        };
      }
      break;
    case "hash":
      if (transaction.memo) {
        memo = {
          type: "MEMO_HASH",
          value: Buffer.from(transaction.memo, "base64").toString("hex"),
        };
      }
      break;
  }

  const operation: Operation = {
    id: `${accountId}-${rawOperation.transaction_hash}-${type}`,
    value: rawOperation?.asset_code ? BigInt(transaction.fee_charged) : BigInt(value.toString()),
    // TODO: doc
    // Using type NONE to hide asset operations from the main account (show them
    // only on sub-account)
    type: rawOperation?.asset_code && !["OPT_IN", "OPT_OUT"].includes(type) ? "NONE" : type,
    senders: [rawOperation.source_account],
    recipients,
    tx: {
      hash: rawOperation.transaction_hash,
      block: {
        hash: blockHash,
        time: new Date(blockTime),
        height: transaction.ledger_attr,
      },
      fees: BigInt(transaction.fee_charged),
      date: new Date(rawOperation.created_at),
      failed: !rawOperation.transaction_successful,
      ...(transaction.fee_account ? { feesPayer: transaction.fee_account } : {}),
    },
    asset:
      rawOperation?.asset_code && rawOperation?.asset_issuer
        ? {
            type: "token",
            assetReference: rawOperation.asset_code,
            assetOwner: rawOperation.asset_issuer,
          }
        : { type: "native" },
    details: {
      pagingToken: rawOperation.paging_token,
      assetCode: rawOperation.asset_code,
      assetIssuer: rawOperation.asset_issuer,
      assetAmount: rawOperation.asset_code ? value.toString() : undefined,
      ledgerOpType: type,
      blockTime: new Date(blockTime),
      index: rawOperation.id,
      memo,
      sequence: new BigNumber(transaction.source_account_sequence).isNaN()
        ? undefined
        : new BigNumber(transaction.source_account_sequence).toString(),
    },
  };

  return operation;
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

function getValue(
  operation: RawOperation,
  transaction: Horizon.ServerApi.TransactionRecord,
  type: string,
): BigNumber {
  let value = new BigNumber(0);

  if (!operation.transaction_successful) {
    return type === "IN" ? value : new BigNumber(transaction.fee_charged || 0);
  }

  switch (operation.type) {
    case "create_account":
      value = parseAPIValue(operation.starting_balance);

      if (type === "OUT") {
        value = value.plus(transaction.fee_charged);
      }

      return value;

    case "payment":
    case "path_payment_strict_send":
    case "path_payment_strict_receive":
      return parseAPIValue(operation.amount);

    default:
      return type !== "IN" ? new BigNumber(transaction.fee_charged) : value;
  }
}

function getOperationType(operation: RawOperation, addr: string): string {
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
