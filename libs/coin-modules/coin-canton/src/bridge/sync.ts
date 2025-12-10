import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { default as BigNumber } from "bignumber.js";
import { getBalance } from "../common-logic/account/getBalance";
import coinConfig from "../config";
import { isCantonAccountEmpty } from "../helpers";
import {
  getCalTokensCached,
  getEnabledInstrumentsCached,
  getKey,
  getLedgerEnd,
  getOperations,
  getPendingTransferProposals,
  SEPARATOR,
} from "../network/gateway";
import resolver from "../signer";
import { CantonAccount, CantonResources, CantonSigner } from "../types";
import type { OperationView } from "../types/gateway";
import { buildSubAccounts } from "./buildSubAccounts";
import { isAccountOnboarded } from "./onboard";

function determineOperationType(
  details: unknown,
  partyId: string,
  senders: string[],
  transferValue: string,
  txType: string,
): OperationType {
  const operationType =
    details && typeof details === "object" && "operationType" in details
      ? details.operationType
      : undefined;
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

function extractMemo(details: unknown) {
  if (!details || typeof details !== "object") return undefined;

  const metadata = "metadata" in details ? details.metadata : undefined;
  if (!metadata || typeof metadata !== "object") return undefined;

  const reason = "reason" in metadata ? metadata.reason : undefined;
  return reason !== undefined ? String(reason) : undefined;
}

const txInfoToOperationAdapter =
  (accountId: string, partyId: string) =>
  (txInfo: OperationView): Operation => {
    const {
      asset,
      uid,
      fee: { value: fee },
      block: { height, hash },
      senders = [],
      recipients = [],
      transfers = [],
      transaction_timestamp,
      transaction_hash,
    } = txInfo;

    const instrumentId =
      asset && (asset.type === "native" || asset.type === "token") ? asset.instrumentId : undefined;
    const instrumentAdmin =
      asset && (asset.type === "native" || asset.type === "token")
        ? asset.instrumentAdmin
        : undefined;

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
      accountId,
      date: new Date(transaction_timestamp),
      hash: transaction_hash,
      type,
      value,
      fee: feeValue,
      senders,
      recipients,
      blockHeight: height,
      blockHash: hash,
      transactionSequenceNumber: new BigNumber(height),
      extra: {
        uid,
        memo,
        instrumentId,
        instrumentAdmin,
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

export async function filterDisabledTokenAccounts(
  currency: CryptoCurrency,
  subAccounts: TokenAccount[] | undefined,
  calTokens: Map<string, string>,
): Promise<TokenAccount[]> {
  if (!subAccounts || subAccounts.length === 0) {
    return [];
  }

  const enabledInstruments = await getEnabledInstrumentsCached(currency);
  return subAccounts.filter(subAccount => {
    const instrumentId = calTokens.get(subAccount.token.id);
    const adminId = subAccount.token.contractAddress;
    if (!instrumentId || !adminId) {
      return false;
    }

    return enabledInstruments.has(getKey(instrumentId, adminId));
  });
}

export function makeGetAccountShape(
  signerContext: SignerContext<CantonSigner>,
): GetAccountShape<CantonAccount> {
  return async info => {
    const { address, currency, derivationMode, derivationPath, initialAccount } = info;

    let isOnboarded = initialAccount?.cantonResources?.isOnboarded ?? false;
    let xpubOrAddress = (initialAccount?.xpub || initialAccount?.cantonResources?.xpub) ?? "";
    let publicKey: string | undefined = initialAccount?.cantonResources?.publicKey;

    if (!xpubOrAddress && !publicKey) {
      const getAddress = resolver(signerContext);
      const addressResult = await getAddress(info.deviceId ?? "", {
        path: derivationPath,
        currency: currency,
        derivationMode: derivationMode,
        verify: false,
      });
      publicKey = addressResult.publicKey;

      const result = await isAccountOnboarded(currency, publicKey);
      isOnboarded = result.isOnboarded;

      if (isOnboarded && result.partyId) {
        xpubOrAddress = result.partyId;
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

    // Aggregate all balances by instrument (unlocked + locked)
    const aggregatedBalances = new Map<
      string,
      {
        unlockedBalance: bigint;
        lockedBalance: bigint;
        utxoCount: number;
        token: TokenCurrency | null;
        adminId: string;
      }
    >();

    const proposalInstrumentKeys = new Set(
      pendingTransferProposals.map(proposal =>
        getKey(proposal.instrument_id, proposal.instrument_admin),
      ),
    );
    for (const key of proposalInstrumentKeys) {
      if (aggregatedBalances.has(key)) continue;

      const [instrumentId, adminId] = key.split(SEPARATOR);
      balances.push({
        value: 0n,
        locked: 0n,
        utxoCount: 0,
        instrumentId,
        adminId,
        asset: { type: "token", assetReference: instrumentId },
      });
    }

    const tokensByKey = new Map<string, TokenCurrency>();
    for await (const balance of balances) {
      const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
        balance.adminId,
        currency.id,
      );
      if (!token) continue;
      tokensByKey.set(getKey(balance.instrumentId, balance.adminId), token);
    }

    for await (const balance of balances) {
      const isNative = balance.instrumentId === nativeInstrumentId;
      // Use just instrumentId for native (no admin), composite key for tokens
      const balanceKey = isNative
        ? nativeInstrumentId
        : getKey(balance.instrumentId, balance.adminId);
      const token: TokenCurrency | null = isNative ? null : tokensByKey.get(balanceKey) ?? null;

      const existing = aggregatedBalances.get(balanceKey);
      if (existing) {
        if (balance.locked) {
          existing.lockedBalance += balance.value;
        } else {
          existing.unlockedBalance += balance.value;
        }
        existing.utxoCount += balance.utxoCount;
      } else {
        aggregatedBalances.set(balanceKey, {
          unlockedBalance: balance.locked ? 0n : balance.value,
          lockedBalance: balance.locked ? balance.value : 0n,
          utxoCount: balance.utxoCount,
          token,
          adminId: balance.adminId,
        });
      }
    }

    // Find native balance (token is null for native)
    const nativeBalance = Array.from(aggregatedBalances.values()).find(data => data.token === null);
    const unlockedAmount = new BigNumber((nativeBalance?.unlockedBalance ?? 0n).toString());
    const lockedAmount = new BigNumber((nativeBalance?.lockedBalance ?? 0n).toString());
    const totalBalance = unlockedAmount.plus(lockedAmount);
    const reserveMin = new BigNumber(coinConfig.getCoinConfig(currency).minReserve || 0);
    const spendableBalance = BigNumber.max(0, unlockedAmount.minus(reserveMin));

    const instrumentUtxoCounts: Record<string, number> = {};
    for (const [key, data] of aggregatedBalances) {
      instrumentUtxoCounts[key] = data.utxoCount;
    }

    const tokenBalances = Array.from(aggregatedBalances.entries())
      .filter(([, data]) => data.token !== null)
      .map(([, { unlockedBalance, lockedBalance, token, adminId }]) => ({
        totalBalance: unlockedBalance + lockedBalance,
        spendableBalance: unlockedBalance,
        token: token!,
        adminId,
      }));

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

    // Filter main account operations (native instrument only)
    const mainAccountOperations = operations.filter(op => {
      const extra = op.extra as { instrumentId?: string };
      return extra?.instrumentId === nativeInstrumentId;
    });

    // Build sub-accounts for tokens with their filtered operations

    const calTokens = await getCalTokensCached(currency);

    const subAccounts = buildSubAccounts({
      accountId,
      tokenBalances,
      existingSubAccounts: initialAccount?.subAccounts ?? [],
      allOperations: operations,
      pendingTransferProposals,
      calTokens,
    });

    const cantonResources: CantonResources = {
      isOnboarded,
      instrumentUtxoCounts,
      pendingTransferProposals: pendingTransferProposals.filter(
        proposal => proposal.instrument_id === nativeInstrumentId,
      ),
      ...(publicKey && { publicKey }),
      xpub: xpubOrAddress,
    };

    const filteredSubAccounts = await filterDisabledTokenAccounts(currency, subAccounts, calTokens);

    const used = !isCantonAccountEmpty({
      operationsCount: mainAccountOperations.length,
      balance: totalBalance,
      subAccounts: filteredSubAccounts,
      cantonResources,
    });

    const blockHeight = await getLedgerEnd(currency);

    const creationDate =
      mainAccountOperations.length > 0
        ? new Date(Math.min(...mainAccountOperations.map(op => op.date.getTime())))
        : new Date();

    const shape = {
      id: accountId,
      type: "Account" as const,
      freshAddress: address,
      seedIdentifier: address,
      balance: totalBalance,
      blockHeight,
      creationDate,
      lastSyncDate: new Date(),
      operations: mainAccountOperations,
      operationsCount: mainAccountOperations.length,
      spendableBalance,
      subAccounts: filteredSubAccounts,
      xpub: xpubOrAddress,
      used,
      cantonResources,
    };

    return shape;
  };
}
