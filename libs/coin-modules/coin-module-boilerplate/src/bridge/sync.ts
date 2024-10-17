import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getTransactions } from "../network/indexer";
import { getAccountInfo, getBlockHeight } from "../network/node";

import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { XrplOperation } from "../network/types";
import coinConfig from "../config";

const operationAdapter =
  (accountId: string, address: string) =>
  ({
    meta: { delivered_amount },
    tx: { Fee, hash, inLedger, date, Account, Destination, Sequence },
  }: XrplOperation) => {
    const type = Account === address ? "OUT" : "IN";
    let value =
      delivered_amount && typeof delivered_amount === "string"
        ? new BigNumber(delivered_amount)
        : new BigNumber(0);
    const feeValue = new BigNumber(Fee);

    if (type === "OUT") {
      if (!Number.isNaN(feeValue)) {
        value = value.plus(feeValue);
      }
    }

    const op: Operation = {
      id: encodeOperationId(accountId, hash, type),
      hash: hash,
      accountId,
      type,
      value,
      fee: feeValue,
      blockHash: null,
      blockHeight: inLedger,
      senders: [Account],
      recipients: [Destination],
      date: new Date(),
      transactionSequenceNumber: Sequence,
      extra: {},
    };

    return op;
  };

const filterOperations = (transactions: XrplOperation[], accountId: string, address: string) => {
  return transactions
    .filter(
      ({ tx, meta }: XrplOperation) =>
        tx.TransactionType === "Payment" && typeof meta.delivered_amount === "string",
    )
    .map(operationAdapter(accountId, address))
    .filter((op): op is Operation => Boolean(op));
};

export const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, currency, derivationMode } = info;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  // blockheight retrieval
  const blockHeight = await getBlockHeight();

  // Account info retrieval + spendable balance calculation
  const accountInfo = await getAccountInfo(address);
  const balance = new BigNumber(accountInfo.account_data.Balance);
  const reserveMin = coinConfig.getCoinConfig().minReserve;
  const spendableBalance = new BigNumber(accountInfo.account_data.Balance).minus(reserveMin);

  // Tx history fetching
  const oldOperations = initialAccount?.operations || [];
  const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;
  const newTransactions = await getTransactions(address, {
    from: startAt,
    size: 100,
  });
  const newOperations = filterOperations(newTransactions, accountId, address);
  const operations = mergeOps(oldOperations, newOperations as Operation[]);

  // We return the new account shape
  const shape = {
    id: accountId,
    xpub: address,
    blockHeight,
    balance,
    spendableBalance,
    operations,
    operationsCount: operations.length,
  };

  return shape;
};
