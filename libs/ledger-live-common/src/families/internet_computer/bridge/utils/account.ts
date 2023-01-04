import { GetAccountShape } from "../../../../bridge/jsHelpers";
import { encodeAccountId } from "../../../../account";
import { log } from "@ledgerhq/logs";
import { fetchBalances, fetchBlockHeight, fetchTxns } from "./network";
import { flatMap } from "lodash";
import { Account, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { GetTxnsHistoryResponse } from "./types";
import { ICP_FEES } from "../../consts";
import { encodeOperationId } from "../../../../operation";
import { normalizeEpochTimestamp } from "../../utils";

const mapTxToOps = (accountId: string, address: string, fee = ICP_FEES) => {
  return (txInfo: GetTxnsHistoryResponse["transactions"][0]): Operation[] => {
    const ops: Operation[] = [];
    const ownerOperation = txInfo.transaction.operations.find(
      (cur) => cur.account.address === address
    );
    const counterOperation = txInfo.transaction.operations.find(
      (cur) => cur.account.address !== address
    );

    if (!ownerOperation || !counterOperation) return ops;

    const timeStamp = txInfo.transaction.metadata.timestamp;
    const amount = BigNumber(ownerOperation.amount.value);
    const hash = txInfo.transaction.transaction_identifier.hash;
    const fromAccount = amount.isPositive()
      ? counterOperation.account.address
      : ownerOperation.account.address;
    const toAccount = amount.isNegative()
      ? counterOperation.account.address
      : ownerOperation.account.address;
    const memo = txInfo.transaction.metadata.memo;

    const date = new Date(normalizeEpochTimestamp(timeStamp));
    const value = amount.abs();
    const feeToUse = BigNumber(fee);

    const isSending = amount.isNegative();
    const isReceiving = amount.isPositive();

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, "OUT"),
        hash,
        type: "OUT",
        value: value.plus(feeToUse),
        fee: feeToUse,
        blockHeight: 1,
        blockHash: null,
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
        id: encodeOperationId(accountId, hash, "IN"),
        hash,
        type: "IN",
        value,
        fee: feeToUse,
        blockHeight: 1,
        blockHash: null,
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

export const getAccountShape: GetAccountShape = async (info) => {
  const { address, currency, derivationMode } = info;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  log("debug", `Generation account shape for ${address}`);

  const blockHeight = await fetchBlockHeight();
  const balanceResp = await fetchBalances(address);
  const balance = balanceResp.balances[0];

  const txns = await fetchTxns(address);

  const result: Partial<Account> = {
    id: accountId,
    balance: BigNumber(balance.value),
    spendableBalance: BigNumber(balance.value),
    operations: flatMap(txns.transactions, mapTxToOps(accountId, address)),
    blockHeight: blockHeight.current_block_identifier.index,
  };

  return result;
};
