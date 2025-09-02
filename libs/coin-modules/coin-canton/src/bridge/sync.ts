import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getBalance, getLedgerEnd, getTransactions, type TxInfo } from "../network/gateway";

import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import coinConfig from "../config";

const txInfoToOperationAdapter =
  (accountId: string, address: string) =>
  (txInfo: TxInfo): Operation => {
    const { update_id, command_id, offset, effective_at, events } = txInfo;

    // For now, assume all operations are "IN" type since we don't have sender/recipient info
    const type = "IN";
    const value = new BigNumber(0); // TODO: Extract value from events
    const feeValue = new BigNumber(0); // TODO: Extract fee from events

    const op: Operation = {
      id: encodeOperationId(accountId, update_id, type),
      hash: update_id,
      accountId,
      type,
      value,
      fee: feeValue,
      blockHash: null,
      blockHeight: offset,
      senders: [address], // TODO: Extract from events
      recipients: [address], // TODO: Extract from events
      date: new Date(effective_at.seconds * 1000),
      transactionSequenceNumber: offset,
      extra: {
        command_id,
        workflow_id: txInfo.workflow_id,
        events,
      },
    };

    return op;
  };

const filterOperations = (
  transactions: TxInfo[],
  accountId: string,
  address: string,
): Operation[] => {
  return (
    transactions
      // .filter(({ command_id }: TxInfo) => command_id === "Payment")
      .map(txInfoToOperationAdapter(accountId, address))
      .filter((op): op is Operation => Boolean(op))
  );
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
  const balanceData = await getBalance(address);
  const balance = new BigNumber(balanceData[0]?.amount || "0");
  const reserveMin = coinConfig.getCoinConfig().minReserve || 0;
  const spendableBalance = balance.minus(BigNumber(reserveMin));

  // Tx history fetching
  const oldOperations = initialAccount?.operations || [];
  const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;
  const transactionData = await getTransactions(address, {
    cursor: 0,
    limit: 100,
  });
  const newOperations = filterOperations(transactionData.transactions, accountId, address);
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
