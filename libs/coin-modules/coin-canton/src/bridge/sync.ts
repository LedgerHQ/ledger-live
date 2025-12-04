import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getBalance, type CantonBalance } from "../common-logic/account/getBalance";
import coinConfig from "../config";
import { isCantonAccountEmpty } from "../helpers";
import { getLedgerEnd, getOperations, getPendingTransferProposals } from "../network/gateway";
import resolver from "../signer";
import { CantonAccount, CantonSigner } from "../types";
import type { OperationView } from "../types/gateway";
import { isAccountOnboarded } from "./onboard";

const txInfoToOperationAdapter =
  (accountId: string, partyId: string) =>
  (txInfo: OperationView): Operation => {
    const {
      transaction_hash,
      uid,
      block: { height, hash },
      senders = [],
      recipients = [],
      transaction_timestamp,
      fee: { value: fee },
      transfers = [],
    } = txInfo;

    const transferValue = transfers[0]?.value ?? "0";
    const details = transfers[0]?.details ?? {};

    let type: OperationType = "UNKNOWN";
    if (details.operationType === "transfer-proposal") {
      type = "TRANSFER_PROPOSAL";
    } else if (details.operationType === "transfer-rejected") {
      type = "TRANSFER_REJECTED";
    } else if (details.operationType === "transfer-withdrawn") {
      type = "TRANSFER_WITHDRAWN";
    } else if (txInfo.type === "Send" && transferValue === "0") {
      type = "FEES";
    } else if (txInfo.type === "Send") {
      type = senders.includes(partyId) ? "OUT" : "IN";
    } else if (txInfo.type === "Receive") {
      type = "IN";
    } else if (txInfo.type === "Initialize") {
      type = "PRE_APPROVAL";
    }
    let value = new BigNumber(transferValue);

    if (type === "OUT" || type === "FEES") {
      // We add fees when it's an outgoing transaction or a fees-only transaction
      value = value.plus(fee);
    }

    const feeValue = new BigNumber(fee);
    const memo =
      details &&
      typeof details === "object" &&
      "metadata" in details &&
      details.metadata &&
      typeof details.metadata === "object" &&
      "reason" in details.metadata
        ? String(details.metadata.reason)
        : undefined;

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
      transactionSequenceNumber: new BigNumber(height),
      extra: {
        uid,
        memo,
      },
    };

    return op;
  };

const filterOperations = (
  transactions: OperationView[],
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
    let publicKey: string | undefined = initialAccount?.cantonResources?.publicKey;

    if (!xpubOrAddress || !publicKey) {
      const getAddress = resolver(signerContext);
      const addressResult = await getAddress(info.deviceId || "", {
        path: derivationPath,
        currency: currency,
        derivationMode: derivationMode,
        verify: false,
      });
      publicKey = addressResult.publicKey;

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
    const pendingTransferProposals = xpubOrAddress
      ? await getPendingTransferProposals(currency, xpubOrAddress)
      : [];

    const balancesData = (balances || []).reduce(
      (acc, balance) => {
        if (balance.locked) {
          acc[`Locked${balance.instrumentId}`] = balance;
        } else {
          acc[balance.instrumentId] = balance;
        }
        return acc;
      },
      {} as Record<string, CantonBalance>,
    );

    const unlockedAmount = new BigNumber(balancesData[nativeInstrumentId]?.value.toString() || "0");
    const lockedAmount = new BigNumber(
      balancesData[`Locked${nativeInstrumentId}`]?.value.toString() || "0",
    );
    const totalBalance = unlockedAmount.plus(lockedAmount);
    const reserveMin = new BigNumber(coinConfig.getCoinConfig(currency).minReserve || 0);
    const spendableBalance = BigNumber.max(0, totalBalance.minus(reserveMin));

    const instrumentUtxoCounts: Record<string, number> = {};
    for (const [instrumentId, balance] of Object.entries(balancesData)) {
      instrumentUtxoCounts[instrumentId] = balance.utxoCount;
    }

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

    const used = !isCantonAccountEmpty({
      operationsCount: operations.length,
      balance: totalBalance,
      subAccounts: initialAccount?.subAccounts ?? [],
      cantonResources: {
        instrumentUtxoCounts,
        pendingTransferProposals,
        publicKey,
      },
    });

    const blockHeight = await getLedgerEnd(currency);

    const creationDate =
      operations.length > 0
        ? new Date(Math.min(...operations.map(op => op.date.getTime())))
        : new Date();

    const shape = {
      id: accountId,
      type: "Account" as const,
      balance: totalBalance,
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
      cantonResources: {
        instrumentUtxoCounts,
        pendingTransferProposals,
        publicKey,
      },
    };

    return shape;
  };
}
