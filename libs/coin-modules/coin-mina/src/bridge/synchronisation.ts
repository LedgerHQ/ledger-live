import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeSync, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { getAccount, getBlockInfo, getTransactions } from "../api";
import { RosettaTransaction } from "../api/rosetta/types";
import { MinaAccount, MinaOperation } from "../types/common";

export const mapRosettaTxnToOperation = async (
  accountId: string,
  address: string,
  txn: RosettaTransaction,
): Promise<MinaOperation[]> => {
  try {
    const hash = txn.transaction.transaction_identifier.hash;
    const blockHeight = txn.block_identifier.index;
    const blockHash = txn.block_identifier.hash;
    const date = new Date(txn.timestamp ?? (await getBlockInfo(blockHeight)).block.timestamp);
    const memo = txn.transaction.metadata?.memo || "";

    let value = new BigNumber(0);
    let fee = new BigNumber(0);
    let accountCreationFee = new BigNumber(0);

    let fromAccount: string = "";
    let toAccount: string = "";
    let isSending = false;
    let failed = false;
    let redelegateTransaction = false;

    for (const op of txn.transaction.operations) {
      failed = failed || op.status === "Failed";
      const opValue = failed ? new BigNumber(0) : new BigNumber(op.amount?.value ?? 0);
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
        case "zkapp_fee_payer_dec": {
          fromAccount = op.account.address;
          continue;
        }
        case "zkapp_balance_update": {
          toAccount = op.account.address;
          value = value.plus(opValue);
          continue;
        }
        case "delegate_change": {
          fromAccount = op.account.address;
          toAccount = op.metadata?.delegate_change_target || toAccount || "unknown";
          redelegateTransaction = true;
          continue;
        }
        case "account_creation_fee_via_payment": {
          accountCreationFee = opValue.times(-1);
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
      hasFailed: failed,
      blockHash,
      accountId,
      senders: [fromAccount],
      recipients: [toAccount],
      date,
      extra: {
        memo,
        accountCreationFee: accountCreationFee.toString(),
      },
    };

    const ops: MinaOperation[] = [];
    if (isSending) {
      const type = "OUT";
      ops.push({
        ...op,
        value: value.minus(accountCreationFee).plus(fee),
        type,
        id: encodeOperationId(accountId, hash, type),
      });
    } else if (redelegateTransaction) {
      // delegate change
      const type = "REDELEGATE";
      ops.push({
        ...op,
        value: new BigNumber(0),
        type,
        id: encodeOperationId(accountId, hash, type),
      });
    } else {
      const type = "IN";
      ops.push({
        ...op,
        value: value.minus(accountCreationFee),
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

export const getAccountShape: GetAccountShape<MinaAccount> = async info => {
  const { address, initialAccount, currency, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const { blockHeight, balance, spendableBalance } = await getAccount(address);

  const rosettaTxns = await getTransactions(address, initialAccount?.operations.length);
  const newOperations = await Promise.all(
    rosettaTxns.flatMap(t => mapRosettaTxnToOperation(accountId, address, t)),
  );

  const operations = mergeOps(oldOperations, newOperations.flat());

  const shape: Partial<MinaAccount> = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
  };

  return { ...shape, operations };
};

export const sync = makeSync({ getAccountShape });
