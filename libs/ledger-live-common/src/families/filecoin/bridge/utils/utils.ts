import { Account, Address, Operation } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../../../currencies";
import { BigNumber } from "bignumber.js";
import { BroadcastTransactionRequest, TransactionResponse, TxStatus } from "./types";
import { GetAccountShape, AccountShapeInfo } from "../../../../bridge/jsHelpers";
import { fetchBalances, fetchBlockHeight, fetchTxs } from "./api";
import { encodeAccountId } from "../../../../account";
import { encodeOperationId } from "../../../../operation";
import flatMap from "lodash/flatMap";

type TxsById = {
  [id: string]:
    | {
        Send: TransactionResponse;
        Fee?: TransactionResponse;
      }
    | {
        InvokeContract: TransactionResponse;
        Fee?: TransactionResponse;
      };
};

export const getUnit = () => getCryptoCurrencyById("filecoin").units[0];

export const processTxs = (txs: TransactionResponse[]): TransactionResponse[] => {
  // Group all tx types related to same tx cid into the same object
  const txsByTxCid = txs.reduce((txsByTxCidResult: TxsById, currentTx) => {
    const { hash: txCid, type: txType } = currentTx;
    const txByType = txsByTxCidResult[txCid] || {};

    switch (txType) {
      case "Send":
      case "InvokeContract":
      case "Fee":
        txByType[txType] = currentTx;
        break;
      default:
        log("warn", `tx type [${txType}] on tx cid [${txCid}] was not recognized.`);
        break;
    }

    txsByTxCidResult[txCid] = txByType;
    return txsByTxCidResult;
  }, {});

  // Once all tx types have been grouped, we want to find
  const processedTxs: TransactionResponse[] = [];
  for (const txCid in txsByTxCid) {
    const item = txsByTxCid[txCid];
    const feeTx = item.Fee;
    let mainTx: TransactionResponse | undefined;
    if ("Send" in item) {
      mainTx = item.Send;
    } else if ("InvokeContract" in item) {
      mainTx = item.InvokeContract;
    } else {
      log(
        "warn",
        `unexpected tx type, tx with cid [${txCid}] and payload [${JSON.stringify(item)}]`,
      );
    }

    if (!mainTx) {
      if (feeTx) {
        log("warn", `feeTx [${feeTx.hash}] found without a mainTx linked to it.`);
      }

      continue;
    }

    if (feeTx) {
      mainTx.fee = feeTx.amount;
    }

    processedTxs.push(mainTx);
  }

  return processedTxs;
};

export const mapTxToOps =
  (accountId, { address }: AccountShapeInfo) =>
  (tx: TransactionResponse): Operation[] => {
    const { to, from, hash, timestamp, amount, fee, status } = tx;
    const ops: Operation[] = [];
    const date = new Date(timestamp * 1000);
    const value = parseCurrencyUnit(getUnit(), amount.toString());
    const feeToUse = parseCurrencyUnit(getUnit(), (fee || 0).toString());

    const isSending = address === from;
    const isReceiving = address === to;
    const hasFailed = status !== TxStatus.Ok;

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
        hasFailed,
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
        hasFailed,
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
  signature: string,
  rawData: Record<string, any>,
): BroadcastTransactionRequest => {
  const { senders, recipients, value, fee } = operation;
  const { gasLimit, gasFeeCap, gasPremium, method, version, nonce, signatureType } = rawData;

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

export const getAccountShape: GetAccountShape = async info => {
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
