import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getBalance, getLedgerEnd, getOperations, type OperationInfo } from "../network/gateway";

import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import coinConfig from "../config";

const txInfoToOperationAdapter =
  (accountId: string, address: string) =>
  (txInfo: OperationInfo): Operation => {
    const {
      transaction_hash,
      uid,
      block: { height, hash },
      senders,
      recipients,
      transaction_timestamp,
      fee: { value: fee },
      transfers: [{ value: transferValue }],
    } = txInfo;

    const type = senders.includes(address) ? "OUT" : "IN";
    const value = new BigNumber(transferValue);
    const feeValue = new BigNumber(fee);

    const op: Operation = {
      id: encodeOperationId(accountId, transaction_hash, type),
      hash: transaction_hash,
      accountId,
      type,
      value,
      fee: feeValue,
      blockHash: hash,
      blockHeight: height,
      senders,
      recipients,
      date: new Date(transaction_timestamp),
      transactionSequenceNumber: height,
      extra: {
        uid,
      },
    };

    return op;
  };

const filterOperations = (
  transactions: OperationInfo[],
  accountId: string,
  address: string,
): Operation[] => {
  return transactions
    .filter(tx => tx.type === "Receive" || tx.type === "Send")
    .map(txInfoToOperationAdapter(accountId, address));
};

export const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, currency, derivationMode } = info;
  // TODO: we need better solution ?
  const xpubOrAddress = address?.replace(/:/g, "_") || "";

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress,
    derivationMode: "",
  });

  // blockheight retrieval
  const blockHeight = await getLedgerEnd();

  // Account info retrieval + spendable balance calculation
  // const accountInfo = await getAccountInfo(address);
  const balances = await getBalance(address);

  const balanceData = balances.find(balance => balance.instrument_id === "canton_network") || {
    instrument_id: "canton_network",
    amount: 0,
    locked: false,
  };

  const balance = new BigNumber(balanceData.amount);
  const reserveMin = coinConfig.getCoinConfig().minReserve || 0;
  const lockedAmount = balanceData.locked ? balance : new BigNumber(0);
  const spendableBalance = BigNumber.max(
    0,
    balance.minus(lockedAmount).minus(BigNumber(reserveMin)),
  );

  // Tx history fetching
  const oldOperations = initialAccount?.operations || [];
  const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;
  const transactionData = await getOperations(address, {
    cursor: 0,
    limit: 100,
  });

  const newOperations = filterOperations(transactionData.operations, accountId, address);
  const operations = mergeOps(oldOperations, newOperations);

  // We return the new account shape
  const shape = {
    id: accountId,
    xpub: xpubOrAddress,
    blockHeight,
    balance,
    spendableBalance,
    operations,
    operationsCount: operations.length,
  };

  return shape;
};
