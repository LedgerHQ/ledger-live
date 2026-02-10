import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, OperationType } from "@ledgerhq/types-live";
import {
  deriveAddressFromPubkey,
  hashTransaction,
  TransactionWithId,
} from "@zondax/ledger-live-icp";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { fetchBalance, fetchBlockHeight, fetchTxns } from "../../api";
import { normalizeEpochTimestamp } from "../../common-logic/utils";
import { ICP_FEES } from "../../consts";
import { InternetComputerOperation } from "../../types";

export const getAccountShape: GetAccountShape = async info => {
  const { currency, derivationMode, rest = {}, initialAccount } = info;
  const publicKey = reconciliatePublicKey(rest.publicKey, initialAccount);
  invariant(publicKey, "publicKey is required");

  // deriving address from public key
  const address = await deriveAddressFromPubkey(publicKey);
  invariant(address, "address is required");

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey,
    derivationMode,
  });

  // log("debug", `Generation account shape for ${address}`);

  const blockHeight = await fetchBlockHeight();
  const balance = await fetchBalance(address);
  const txns = await fetchTxns(
    address,
    BigInt(blockHeight.toString()),
    initialAccount ? BigInt(initialAccount.blockHeight.toString()) : undefined,
  );

  const result: Partial<Account> = {
    id: accountId,
    balance,
    spendableBalance: balance,
    operations: flatMap<TransactionWithId, InternetComputerOperation>(
      txns,
      mapTxToOps(accountId, address),
    ),
    blockHeight: blockHeight.toNumber(),
    operationsCount: (initialAccount?.operations.length ?? 0) + txns.length,
    xpub: publicKey,
  };

  return result;
};

function reconciliatePublicKey(publicKey?: string, initialAccount?: Account): string {
  if (publicKey) return publicKey;
  if (initialAccount) {
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    return xpubOrAddress;
  }
  throw new Error("publicKey wasn't properly restored");
}

const mapTxToOps = (accountId: string, address: string, fee = ICP_FEES) => {
  return (txInfo: TransactionWithId): InternetComputerOperation[] => {
    const { transaction: txn } = txInfo;
    const ops: InternetComputerOperation[] = [];

    if (txn.operation === undefined) {
      return [];
    }

    if ("Transfer" in txn.operation === undefined) {
      return [];
    }

    const timeStamp = txn.timestamp[0]?.timestamp_nanos ?? Date.now();
    let amount = BigNumber(0);
    let fromAccount = "";
    let toAccount = "";
    let hash = "";
    if ("Transfer" in txn.operation) {
      amount = BigNumber(txn.operation.Transfer.amount.e8s.toString());
      fromAccount = txn.operation.Transfer.from;
      toAccount = txn.operation.Transfer.to;
      hash = hashTransaction({
        from: fromAccount,
        to: toAccount,
        amount: txn.operation.Transfer.amount.e8s,
        fee: txn.operation.Transfer.fee.e8s,
        memo: txn.memo,
        created_at_time: txn.created_at_time[0]?.timestamp_nanos ?? BigInt(0),
      });
    }

    const blockHeight = Number(txInfo.id);
    const blockHash = "";

    const memo = txInfo.transaction.memo.toString();

    const date = new Date(normalizeEpochTimestamp(timeStamp.toString()));
    const value = amount.abs();
    const feeToUse = BigNumber(fee);

    const isSending = address === fromAccount;
    const isReceiving = address === toAccount;

    let type: OperationType;
    if (isSending) {
      type = "OUT";
    } else {
      type = "IN";
    }

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, type),
        hash,
        type,
        value: value.plus(feeToUse),
        fee: feeToUse,
        blockHeight,
        blockHash,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          memo,
        },
      });
    }

    if (isReceiving) {
      ops.push({
        id: encodeOperationId(accountId, hash, type),
        hash,
        type,
        value,
        fee: feeToUse,
        blockHeight,
        blockHash,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          memo,
        },
      });
    }

    return ops;
  };
};
