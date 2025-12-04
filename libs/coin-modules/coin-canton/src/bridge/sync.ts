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

function determineOperationType(
  details: Record<string, unknown>,
  partyId: string,
  senders: string[],
  transferValue: string,
  txType: string,
): OperationType {
  const operationType = details.operationType;
  if (operationType === "transfer-proposal") return "TRANSFER_PROPOSAL";
  if (operationType === "transfer-rejected") return "TRANSFER_REJECTED";
  if (operationType === "transfer-withdrawn") return "TRANSFER_WITHDRAWN";

  switch (txType) {
    case "Send":
      // Zero-value sends are fee-only transactions
      if (transferValue === "0") return "FEES";
      // Otherwise, determine if it's outgoing or incoming based on sender
      return senders.includes(partyId) ? "OUT" : "IN";

    case "Receive":
      return "IN";

    case "Initialize":
      return "PRE_APPROVAL";

    default:
      return "UNKNOWN";
  }
}

function extractMemo(details: Record<string, unknown>) {
  if (!details || typeof details !== "object") return undefined;

  const metadata = details.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;

  const reason = "reason" in metadata ? metadata.reason : undefined;
  return reason !== undefined ? String(reason) : undefined;
}

const txInfoToOperationAdapter =
  (accountId: string, partyId: string) =>
  (txInfo: OperationView): Operation => {
    const {
      uid,
      fee: { value: fee },
      block: { height, hash },
      senders = [],
      recipients = [],
      transfers = [],
      transaction_timestamp,
      transaction_hash,
    } = txInfo;

    const transferValue = transfers[0]?.value ?? "0";
    const details = transfers[0]?.details ?? {};
    const memo = extractMemo(details);
    const type = determineOperationType(details, partyId, senders, transferValue, txInfo.type);
    const feeValue = new BigNumber(fee);
    let value = new BigNumber(transferValue);

    if (type === "OUT" || type === "FEES") {
      value = value.plus(feeValue);
    }

    const op: Operation = {
      id: encodeOperationId(accountId, transaction_hash, type),
      hash: transaction_hash,
      type,
      value,
      fee: feeValue,
      senders,
      recipients,
      blockHeight: height,
      blockHash: hash,
      transactionSequenceNumber: new BigNumber(height),
      accountId,
      date: new Date(transaction_timestamp),
      extra: { uid, memo },
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

    const initialBalancesData: Record<string, CantonBalance> = {};
    const balancesData = balances.reduce((acc, balance) => {
      acc[balance.locked ? `Locked${balance.instrumentId}` : balance.instrumentId] = balance;
      return acc;
    }, initialBalancesData);

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
      initialAccount?.creationDate ||
      (operations.length > 0
        ? operations.reduce((min, op) => (op.date < min ? op.date : min), operations[0].date)
        : new Date());

    const shape = {
      id: accountId,
      type: "Account" as const,
      freshAddress: address,
      seedIdentifier: address,
      xpub: xpubOrAddress,
      balance: totalBalance,
      spendableBalance,
      blockHeight,
      creationDate,
      lastSyncDate: new Date(),
      operations,
      operationsCount: operations.length,
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
