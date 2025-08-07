import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, Operation, OperationType, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";
import {
  Balance,
  Operation as CoreOperation,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";

export function extractBalance(balances: Balance[], type: string): Balance {
  return (
    balances.find(balance => balance.asset.type === type) ?? {
      asset: { type },
      value: 0n,
    }
  );
}

export function adaptCoreOperationToLiveOperation(accountId: string, op: CoreOperation): Operation {
  const opType = op.type as OperationType;

  const extra: {
    assetReference?: string;
    assetOwner?: string;
    assetAmount?: string | undefined;
    ledgerOpType?: string | undefined;
    memo?: string | undefined;
  } = {};

  if (op.details?.ledgerOpType !== undefined) {
    extra.ledgerOpType = op.details.ledgerOpType as string;
  }

  if (op.details?.assetAmount !== undefined) {
    extra.assetAmount = op.details.assetAmount as string;
  }

  if (op.asset?.type !== "native") {
    extra.assetReference =
      "assetReference" in (op.asset ?? {}) ? (op.asset as any).assetReference : "";
    extra.assetOwner = "assetOwner" in (op.asset ?? {}) ? (op.asset as any).assetOwner : "";
  }
  if (op.details?.memo) {
    extra.memo = op.details.memo as string;
  }
  const res = {
    id: extra.ledgerOpType
      ? encodeOperationId(accountId, op.tx.hash, extra.ledgerOpType)
      : encodeOperationId(accountId, op.tx.hash, op.type),
    hash: op.tx.hash,
    accountId,
    type: opType,
    value: new BigNumber(op.value.toString()),
    fee: new BigNumber(op.tx.fees.toString()),
    blockHash: op.tx.block.hash,
    blockHeight: op.tx.block.height,
    senders: op.senders,
    recipients: op.recipients,
    date: op.tx.date,
    transactionSequenceNumber: op.details?.sequence as number,
    extra,
  };

  return res;
}

/**
 * Converts a transaction object into a `TransactionIntent` object, which is used to represent
 * the intent of a transaction in a standardized format.
 *
 * @template MemoType - The type of memo supported by the transaction, defaults to `MemoNotSupported`.
 *
 * @param account - The account initiating the transaction. Contains details such as the sender's address.
 * @param transaction - The transaction object containing details about the operation to be performed.
 *   - `assetOwner` (optional): The issuer of the asset, if applicable.
 *   - `assetReference` (optional): The code of the asset, if applicable.
 *   - `mode` (optional): The mode of the transaction, e.g., "changetrust" or "send".
 *   - `fees` (optional): The fees associated with the transaction.
 *   - `memoType` (optional): The type of memo to attach to the transaction.
 *   - `memoValue` (optional): The value of the memo to attach to the transaction.
 *
 * @returns A `TransactionIntent` object containing the standardized representation of the transaction.
 *   - Includes details such as type, sender, recipient, amount, fees, asset, and an optional memo.
 *   - If `assetReference` and `assetOwner` are provided, the asset is represented as a token.
 *   - If `memoType` and `memoValue` are provided, a memo is included; otherwise, a default memo of type "NO_MEMO" is added.
 *
 * @throws An error if the transaction mode is unsupported.
 */
export function transactionToIntent(
  account: Account,
  transaction: TransactionCommon & {
    assetOwner?: string;
    assetReference?: string;
    mode?: string;
    fees?: bigint | null | undefined;
    memoType?: string;
    memoValue?: string;
    useAllAmount?: boolean;
  },
): TransactionIntent<any> & { memo?: { type: string; value?: string } } {
  let transactionType = "Payment"; // NOTE: assuming payment by default here, can be changed based on transaction.mode
  if (transaction.mode) {
    switch (transaction.mode) {
      case "changeTrust":
        transactionType = "changeTrust";
        break;
      case "send":
        transactionType = "send";
        break;
      case "stake":
        // generic staking intent for chains that support delegation/staking
        transactionType = "stake";
        break;
      case "unstake":
        // generic unstake intent for chains that support undelegation
        transactionType = "unstake";
        break;
      default:
        throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
    }
  }
  // tezos staking always uses full amount, ignore specified amount
  const isTezosStaking = account.currency.family === "tezos" && (transactionType === "stake" || transactionType === "unstake");
  const amount = isTezosStaking ? BigInt(0) : fromBigNumberToBigInt(transaction.amount, BigInt(0));
  const useAllAmount = isTezosStaking ? true : !!transaction.useAllAmount;

  const res: TransactionIntent & { memo?: { type: string; value?: string } } = {
    fees: transaction?.fees ? transaction.fees : null,
    type: transactionType,
    sender: account.freshAddress,
    recipient: transaction.recipient,
    amount,
    asset: { type: "native", name: account.currency.name, unit: account.currency.units[0] },
    useAllAmount,
  };
  if (transaction.assetReference && transaction.assetOwner) {
    const { subAccountId } = transaction;
    const { subAccounts } = account;

    const tokenAccount = !subAccountId
      ? null
      : subAccounts && subAccounts.find(ta => ta.id === subAccountId);

    res.asset = {
      type: tokenAccount?.token.tokenType ?? "token",
      assetReference: transaction.assetReference,
      name: tokenAccount?.token.name ?? transaction.assetReference, // NOTE: for stellar, assetReference = tokenAccount.name, this is futureproofing
      unit: account.currency.units[0],
      assetOwner: transaction.assetOwner,
    };
  }
  if (transaction.memoType && transaction.memoValue) {
    res.memo = {
      type: transaction.memoType,
      value: transaction.memoValue,
    };
  } else {
    res.memo = { type: "NO_MEMO" };
  }
  return res;
}

export const buildOptimisticOperation = (
  account: Account,
  transaction: TransactionCommon,
  sequenceNumber?: number,
): Operation => {
  const type = transaction["mode"] === "changeTrust" ? "OPT_IN" : "OUT";
  const fees = BigInt(transaction["fees"]?.toString() || "0");
  const { subAccountId } = transaction;
  const { subAccounts } = account;

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type: type,
    value: subAccountId ? new BigNumber(fees.toString()) : transaction.amount, // match old behavior
    fee: new BigNumber(fees.toString()),
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [transaction.recipient],
    transactionSequenceNumber: sequenceNumber ?? 0,
    accountId: account.id,
    date: new Date(),
    extra: {
      ledgerOpType: type,
      blockTime: new Date(),
      index: "0",
    },
  };

  const tokenAccount = !subAccountId
    ? null
    : subAccounts && subAccounts.find(ta => ta.id === subAccountId);
  if (tokenAccount && subAccountId) {
    operation.subOperations = [
      {
        id: `${subAccountId}--OUT`,
        hash: "",
        type: "OUT",
        value: transaction.useAllAmount ? tokenAccount.balance : transaction.amount,
        fee: new BigNumber(0),
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
        accountId: subAccountId,
        date: new Date(),
        extra: {
          ledgerOpType: type,
        },
      },
    ];
  }
  return operation;
};
