import { Account, Operation } from "@ledgerhq/types-live";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { BroadcastTransactionRequest, TransactionResponse, TxStatus, Transaction } from "../types";
import { GetAccountShape, AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { fetchBalances, fetchBlockHeight, fetchTxs } from "../api/api";
import { encodeAccountId } from "@ledgerhq/coin-framework/account";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import flatMap from "lodash/flatMap";
import { buildTokenAccounts } from "../erc20/tokenAccounts";

export const mapTxToOps =
  (accountId: string, { address }: AccountShapeInfo) =>
  (tx: TransactionResponse): Operation[] => {
    const { to, from, hash, timestamp, amount, fee, status } = tx;
    const ops: Operation[] = [];
    const date = new Date(timestamp * 1000);
    const value = new BigNumber(amount);
    const feeToUse = new BigNumber(fee || 0);

    const isSending = address === from;
    const isReceiving = address === to;
    const hasFailed = status !== TxStatus.Ok;

    if (isSending) {
      const type = value.eq(0) ? "FEES" : "OUT";
      ops.push({
        id: encodeOperationId(accountId, hash, type),
        hash,
        type,
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
      const type = value.eq(0) ? "FEES" : "IN";
      ops.push({
        id: encodeOperationId(accountId, hash, type),
        hash,
        type,
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

export const getAddress = (
  a: Account,
): {
  address: string;
  derivationPath: string;
} => ({ address: a.freshAddress, derivationPath: a.freshAddressPath });

export const getTxToBroadcast = (
  operation: Operation,
  signature: string,
  rawData: Record<string, any>,
): BroadcastTransactionRequest => {
  const {
    sender,
    recipient,
    gasLimit,
    gasFeeCap,
    gasPremium,
    method,
    version,
    nonce,
    signatureType,
    params,
    value,
  } = rawData;

  return {
    message: {
      version,
      method,
      nonce,
      params: params ?? "",
      to: recipient,
      from: sender,
      gaslimit: gasLimit.toNumber(),
      gaspremium: gasPremium.toString(),
      gasfeecap: gasFeeCap.toString(),
      value,
    },
    signature: {
      type: signatureType,
      data: signature,
    },
  };
};

export const getAccountShape: GetAccountShape = async info => {
  const { address, currency, derivationMode, initialAccount } = info;

  const blockSafeDelta = 1200;
  let lastHeight = (initialAccount?.blockHeight ?? 0) - blockSafeDelta;
  if (lastHeight < 0) lastHeight = 0;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const [blockHeight, balance, rawTxs, tokenAccounts] = await Promise.all([
    fetchBlockHeight(),
    fetchBalances(address),
    fetchTxs(address, lastHeight),
    buildTokenAccounts(address, lastHeight, accountId, info.initialAccount),
  ]);

  const result: Partial<Account> = {
    id: accountId,
    subAccounts: tokenAccounts,
    balance: new BigNumber(balance.total_balance),
    spendableBalance: new BigNumber(balance.spendable_balance),
    operations: flatMap(rawTxs, mapTxToOps(accountId, info)).sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    ),
    blockHeight: blockHeight.current_block_identifier.index,
  };
  return result;
};

export const getSubAccount = (account: Account, tx: Transaction) => {
  const subAccount =
    tx.subAccountId && account.subAccounts
      ? account.subAccounts.find(sa => sa.id === tx.subAccountId)
      : null;

  return subAccount;
};

/**
 * convert a value in a given unit to a normalized value
 * For instance, for 1 BTC, valueFromUnit(1, btcUnit) returns 100000000
 * @memberof countervalue
 */
export const valueFromUnit = (valueInUnit: BigNumber, unit: Unit) =>
  valueInUnit.times(new BigNumber(10).pow(unit.magnitude));
