import BigNumber from "bignumber.js";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { getBalance, getLedgerEnd, getOperations, type OperationInfo } from "../network/gateway";
import coinConfig from "../config";
import resolver from "../signer";
import { CantonAccount, CantonSigner } from "../types";
import { isAccountOnboarded, isAccountAuthorized } from "./onboard";

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
      transfers: [{ value: transferValue, details }],
    } = txInfo;
    let type: OperationType = "UNKNOWN";
    if (txInfo.type === "Send" && transferValue === "0") {
      type = "FEES";
    } else if (txInfo.type === "Send") {
      type = senders.includes(partyId) ? "OUT" : "IN";
    } else if (txInfo.type === "Receive") {
      type = "IN";
    } else if (txInfo.type === "Initialize") {
      type = "PRE_APPROVAL";
    }
    const value = new BigNumber(transferValue);
    const feeValue = new BigNumber(fee);
    const memo = details.metadata.reason;

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
        memo,
      },
    };

    return op;
  };

const filterOperations = (
  transactions: OperationInfo[],
  accountId: string,
  partyId: string,
): Operation[] => {
  return transactions.map(txInfoToOperationAdapter(accountId, partyId));
};

export function makeGetAccountShape(
  signerContext: SignerContext<CantonSigner>,
): GetAccountShape<CantonAccount> {
  return async info => {
    const { address, currency, derivationMode, derivationPath, initialAccount } = info;

    let xpubOrAddress = initialAccount?.xpub || "";

    if (!xpubOrAddress) {
      const getAddress = resolver(signerContext);
      const { publicKey } = await getAddress(info.deviceId || "", {
        path: derivationPath,
        currency: currency,
        derivationMode: derivationMode,
        verify: false,
      });

      const { isOnboarded, partyId } = await isAccountOnboarded(currency, publicKey);
      if (isOnboarded && partyId) {
        xpubOrAddress = partyId;
      }
    }

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: xpubOrAddress,
      derivationMode,
    });

    const { nativeInstrumentId } = coinConfig.getCoinConfig(currency);
    const balances = xpubOrAddress ? await getBalance(currency, xpubOrAddress) : [];
    const balanceData = balances.find(balance =>
      balance.instrument_id.includes(nativeInstrumentId),
    ) || {
      instrument_id: nativeInstrumentId,
      amount: 0,
      locked: false,
    };
    const balance = new BigNumber(balanceData.amount);
    const reserveMin = new BigNumber(coinConfig.getCoinConfig(currency).minReserve || 0);
    const lockedAmount = balanceData.locked ? balance : new BigNumber(0);
    const spendableBalance = BigNumber.max(0, balance.minus(lockedAmount).minus(reserveMin));

    let operations: Operation[] = [];
    if (xpubOrAddress) {
      const oldOperations = initialAccount?.operations || [];
      const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;
      const transactionData = await getOperations(currency, xpubOrAddress, {
        cursor: startAt,
        limit: 100,
      });
      const newOperations = filterOperations(transactionData.operations, accountId, xpubOrAddress);
      operations = mergeOps(oldOperations, newOperations);
    }

    const isAuthorized = await isAccountAuthorized(operations, xpubOrAddress);
    const used = isAuthorized && balance.gt(0);

    const blockHeight = await getLedgerEnd(currency);

    const creationDate =
      operations.length > 0
        ? new Date(Math.min(...operations.map(op => op.date.getTime())))
        : new Date();

    const shape = {
      id: accountId,
      type: "Account" as const,
      balance,
      blockHeight,
      creationDate,
      lastSyncDate: new Date(),
      freshAddress: address,
      seedIdentifier: address,
      operations,
      operationsCount: operations.length,
      spendableBalance,
      xpub: xpubOrAddress,
      used,
    };

    return shape;
  };
}
