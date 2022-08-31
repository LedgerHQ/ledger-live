import { Account, Address, Operation } from "@ledgerhq/types-live";
import {
  getCryptoCurrencyById,
  parseCurrencyUnit,
} from "../../../../currencies";
import { BigNumber } from "bignumber.js";
import { BroadcastTransactionRequest, TransactionResponse } from "./types";
import {
  GetAccountShape,
  GetAccountShapeArg0,
} from "../../../../bridge/jsHelpers";
import { fetchBalances, fetchBlockHeight, fetchTxs } from "./api";
import { encodeAccountId } from "../../../../account";
import { encodeOperationId } from "../../../../operation";
import flatMap from "lodash/flatMap";

type TxsById = {
  [id: string]: {
    Send: TransactionResponse;
    Fee?: TransactionResponse;
  };
};

export const getUnit = () => getCryptoCurrencyById("filecoin").units[0];

export const processTxs = (
  txs: TransactionResponse[]
): TransactionResponse[] => {
  const txsById = txs.reduce((result: TxsById, currentTx) => {
    const { hash, type } = currentTx;
    const txById = result[hash] || {};

    if (type == "Send" || type == "Fee") txById[type] = currentTx;

    result[hash] = txById;
    return result;
  }, {});

  const processedTxs: TransactionResponse[] = [];
  for (const txId in txsById) {
    const { Fee: feeTx, Send: sendTx } = txsById[txId];

    if (feeTx) sendTx.fee = feeTx.amount;

    processedTxs.push(sendTx);
  }

  return processedTxs;
};

export const mapTxToOps =
  (accountId, { address }: GetAccountShapeArg0) =>
  (tx: TransactionResponse): Operation[] => {
    const { to, from, hash, timestamp, amount, fee } = tx;
    const ops: Operation[] = [];
    const date = new Date(timestamp * 1000);
    const value = parseCurrencyUnit(getUnit(), amount.toString());
    const feeToUse = parseCurrencyUnit(getUnit(), (fee || 0).toString());

    const isSending = address === from;
    const isReceiving = address === to;

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, "OUT"),
        hash,
        type: "OUT",
        value: value.plus(feeToUse),
        fee: feeToUse,
        blockHeight: tx.height,
        blockHash: null,
        accountId,
        senders: [from],
        recipients: [to],
        date,
        extra: {},
      });
    }

    if (isReceiving) {
      ops.push({
        id: encodeOperationId(accountId, hash, "IN"),
        hash,
        type: "IN",
        value,
        fee: feeToUse,
        blockHeight: tx.height,
        blockHash: null,
        accountId,
        senders: [from],
        recipients: [to],
        date,
        extra: {},
      });
    }

    return ops;
  };

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export const getTxToBroadcast = (
  operation: Operation,
  signature: string
): BroadcastTransactionRequest => {
  const { extra, senders, recipients, value, fee } = operation;
  const {
    gasLimit,
    gasFeeCap,
    gasPremium,
    method,
    version,
    nonce,
    signatureType,
  } = extra;

  return {
    message: {
      version,
      method,
      nonce,
      params: "",
      to: recipients[0],
      from: senders[0],
      gaslimit: gasLimit.toNumber(),
      gaspremium: gasPremium.toString(),
      gasfeecap: gasFeeCap.toString(),
      value: value.minus(fee).toFixed(),
    },
    signature: {
      type: signatureType,
      data: signature,
    },
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

  const blockHeight = await fetchBlockHeight();
  const balance = await fetchBalances(address);
  const rawTxs = await fetchTxs(address);

  const result = {
    id: accountId,
    balance: new BigNumber(balance.total_balance),
    spendableBalance: new BigNumber(balance.spendable_balance),
    operations: flatMap(processTxs(rawTxs), mapTxToOps(accountId, info)),
    blockHeight: blockHeight.current_block_identifier.index,
  };

  return result;
};
