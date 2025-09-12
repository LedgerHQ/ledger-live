import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getBalance, getLedgerEnd, getOperations, type OperationInfo } from "../network/gateway";
import { CantonAccount } from "../types";
import coinConfig from "../config";

const txInfoToOperationAdapter =
  (accountId: string, partyId: string) =>
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
    const type = senders.includes(partyId) ? "OUT" : "IN";
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
  partyId: string,
): Operation[] => {
  return transactions
    .filter(tx => tx.type === "Receive" || tx.type === "Send")
    .map(txInfoToOperationAdapter(accountId, partyId));
};

export const getAccountShape: GetAccountShape<CantonAccount> = async info => {
  const { address, initialAccount, currency, derivationMode, derivationPath, rest } = info;

  const xpubOrAddress = (
    (initialAccount && initialAccount.id && decodeAccountId(initialAccount.id).xpubOrAddress) ||
    ""
  ).replace(/:/g, "_");
  const partyId =
    rest?.cantonResources?.partyId ||
    initialAccount?.cantonResources?.partyId ||
    xpubOrAddress.replace(/_/g, ":");

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress,
    derivationMode,
  });

  // blockheight retrieval
  const blockHeight = await getLedgerEnd();

  // Account info retrieval + spendable balance calculation
  // const accountInfo = await getAccountInfo(address);
  const balances = await getBalance(partyId);

  // TODO change to balance.instrument_id === "Amulet" after update on backend
  const balanceData = balances.find(balance => balance.instrument_id.includes("Amulet")) || {
    instrument_id: "Amulet",
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
  const transactionData = await getOperations(partyId, {
    cursor: startAt,
    limit: 100,
  });

  const newOperations = filterOperations(transactionData.operations, accountId, partyId);
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
    freshAddress: address,
    freshAddressPath: derivationPath,
    cantonResources: {
      partyId,
    },
  };

  return shape;
};
