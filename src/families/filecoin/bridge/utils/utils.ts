import { Account, Address, Operation } from "../../../../types";
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
import flatMap from "lodash/flatMap";
import { Transaction } from "../../types";

export const getUnit = () => getCryptoCurrencyById("filecoin").units[0];

export const mapTxToOps =
  ({ id, address }: GetAccountShapeArg0) =>
  (tx: TransactionResponse): Operation[] => {
    const { to, from, hash, timestamp, amount } = tx;
    const ops: Operation[] = [];
    const date = new Date(timestamp * 1000);
    const value = parseCurrencyUnit(getUnit(), amount.toString());

    const isSending = address === from;
    const isReceiving = address === to;
    const fee = new BigNumber(0);

    if (isSending) {
      ops.push({
        id: `${id}-${hash}-OUT`,
        hash,
        type: "OUT",
        value: value.plus(fee),
        fee,
        blockHeight: tx.height,
        blockHash: null,
        accountId: id,
        senders: [from],
        recipients: [to],
        date,
        extra: {},
      });
    }

    if (isReceiving) {
      ops.push({
        id: `${id}-${hash}-IN`,
        hash,
        type: "IN",
        value,
        fee,
        blockHeight: tx.height,
        blockHash: null,
        accountId: id,
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
  account: Account,
  transaction: Transaction,
  signature: string
): BroadcastTransactionRequest => {
  const { address } = getAddress(account);
  const {
    recipient,
    amount,
    gasLimit,
    gasFeeCap,
    gasPremium,
    method,
    version,
    nonce,
  } = transaction;

  return {
    message: {
      version,
      method,
      nonce,
      params: "",
      to: recipient,
      from: address,
      gaslimit: gasLimit.toNumber(),
      gaspremium: gasPremium.toString(),
      gasfeecap: gasFeeCap.toString(),
      value: amount.toFixed(),
    },
    signature: {
      type: 1,
      data: signature,
    },
  };
};

export const getAccountShape: GetAccountShape = async (info) => {
  const { address } = info;

  const blockHeight = await fetchBlockHeight();
  const balance = await fetchBalances(address);
  const txs = await fetchTxs(address);

  const result = {
    balance: new BigNumber(balance.total_balance),
    spendableBalance: new BigNumber(balance.spendable_balance),

    operations: flatMap(txs, mapTxToOps(info)),
    blockHeight: blockHeight.current_block_identifier.index,
  };

  return result;
};
