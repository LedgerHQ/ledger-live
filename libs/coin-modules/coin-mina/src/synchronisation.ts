import type { Account } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeSync, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAccount, getTransactions } from "./api";
import { MinaAccount, MinaOperation } from "./types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import { RosettaTransaction } from "./api/rosetta/types";

const mapRosettaTxnToOperation = (
  accountId: string,
  address: string,
  txn: RosettaTransaction,
): MinaOperation[] => {
  try {
    const hash = txn.transaction.transaction_identifier.hash;
    const blockHeight = txn.block_identifier.index;
    const blockHash = txn.block_identifier.hash;
    const date = new Date(txn.timestamp);
    const memo = txn.transaction.metadata?.memo || "";

    let value = new BigNumber(0);
    let fee = new BigNumber(0);

    let fromAccount: string = "";
    let toAccount: string = "";
    let isSending = false;
    for (const op of txn.transaction.operations) {
      const opValue = new BigNumber(op.amount.value);
      switch (op.type) {
        case "fee_payment": {
          fee = fee.plus(opValue.times(-1));
          continue;
        }
        case "payment_receiver_inc": {
          toAccount = op.account.address;
          value = value.plus(opValue);
          continue;
        }
        case "payment_source_dec": {
          fromAccount = op.account.address;
          if (fromAccount === address) {
            isSending = true;
          }
          continue;
        }
        case "account_creation_fee_via_payment": {
          fee = fee.plus(opValue.times(-1));
          continue;
        }
      }
    }

    invariant(fromAccount, "mina: missing fromAccount");
    invariant(toAccount, "mina: missing toAccount");

    const op: MinaOperation = {
      id: "",
      type: "NONE",
      hash,
      value,
      fee,
      blockHeight,
      blockHash,
      accountId,
      senders: [fromAccount],
      recipients: [toAccount],
      date,
      extra: {
        memo,
      },
    };

    const ops: MinaOperation[] = [];
    if (isSending) {
      const type = "OUT";
      ops.push({
        ...op,
        type,
        id: encodeOperationId(accountId, hash, type),
      });
    } else {
      const type = "IN";
      ops.push({
        ...op,
        type,
        id: encodeOperationId(accountId, hash, type),
      });
    }

    return ops;
  } catch (e) {
    log("error", "mina: failed to convert txn to operation", {
      error: e,
      transaction: txn,
    });
    return [];
  }
};

export const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, currency, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  // log("debug", "getAccountShape, address: ", { address });
  const { blockHeight, balance, spendableBalance } = await getAccount(address);

  const rosettaTxns = await getTransactions(address);
  const newOperations = rosettaTxns
    .flatMap(t => mapRosettaTxnToOperation(accountId, address, t))
    .flat();

  const operations = mergeOps(oldOperations, newOperations);

  const shape: Partial<MinaAccount> = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
  };

  return { ...shape, operations };
};

const postSync = (initial: Account, synced: Account): Account => {
  const pendingOperations = initial.pendingOperations || [];

  if (pendingOperations.length === 0) {
    return synced;
  }

  const { operations } = synced;

  synced.pendingOperations = pendingOperations.filter(
    po => !operations.some(o => o.hash === po.hash),
  );

  return synced;
};

export const sync = makeSync({ getAccountShape, postSync });
