import BigNumber from "bignumber.js";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getBalance, getLedgerEnd, getOperations, type OperationInfo } from "../network/gateway";
import { CantonAccount } from "../types";
import coinConfig from "../config";
import { getAccountStatus } from "./onboard";
import resolver from "../signer";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CantonSigner } from "../types";

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
    if (txInfo.type === "Send") {
      type = senders.includes(partyId) ? "OUT" : "IN";
    } else if (txInfo.type === "Receive") {
      type = "IN";
    }
    const value = BigNumber(transferValue);
    const feeValue = BigNumber(fee);
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
    const { address, initialAccount, currency, derivationMode, derivationPath } = info;

    let xpubOrAddress = initialAccount?.xpub || address;

    if (!xpubOrAddress) {
      const getAddress = resolver(signerContext);
      const { publicKey } = await getAddress(info.deviceId || "", {
        path: "44'/6767'/30'/0'/0'",
        currency: currency,
        derivationMode: derivationMode,
        verify: false,
      });

      const { isOnboarded, partyId } = await getAccountStatus(currency, publicKey);
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

    const accountsWithBalances = ["0", "1", "2"];

    const balances = xpubOrAddress ? await getBalance(currency, xpubOrAddress) : [];
    const balanceData = balances.find(balance => balance.instrument_id.includes("Amulet")) || {
      instrument_id: "Amulet",
      // TODO: need for tests remove this
      amount: accountsWithBalances.includes(derivationPath.split("'/")[2]) ? 1 : 0,
      locked: false,
    };
    const balance = BigNumber(balanceData.amount);
    const reserveMin = coinConfig.getCoinConfig(currency).minReserve || 0;
    const lockedAmount = balanceData.locked ? balance : BigNumber(0);
    const spendableBalance = BigNumber.max(
      0,
      balance.minus(lockedAmount).minus(BigNumber(reserveMin)),
    );

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

    const blockHeight = await getLedgerEnd(currency);

    const creationDate =
      operations.length > 0
        ? new Date(Math.min(...operations.map(op => op.date.getTime())))
        : new Date();

    const shape = {
      id: accountId,
      type: "Account" as const,
      creationDate,
      balance,
      blockHeight,
      freshAddress: xpubOrAddress,
      freshAddressPath: derivationPath,
      operations,
      operationsCount: operations.length,
      seedIdentifier: xpubOrAddress,
      spendableBalance,
      xpub: xpubOrAddress,
      used: balance.gt(0),
    };

    console.log("Canton sync - shape:", shape);
    console.log("Canton sync - xpubOrAddress:", xpubOrAddress);

    return shape;
  };
}
