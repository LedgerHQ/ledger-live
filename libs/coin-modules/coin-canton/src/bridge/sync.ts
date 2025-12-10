import BigNumber from "bignumber.js";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import {
  getLedgerEnd,
  getOperations,
  type OperationInfo,
  getPendingTransferProposals,
  getCalTokensCached,
} from "../network/gateway";
import { getBalance } from "../common-logic/account/getBalance";
import coinConfig from "../config";
import resolver from "../signer";
import { CantonAccount, CantonResources, CantonSigner } from "../types";
import { isAccountOnboarded } from "./onboard";
import { isCantonAccountEmpty } from "../helpers";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { buildSubAccounts } from "./buildSubAccounts";

const SEPARATOR = "____";

const getKey = (id: string, adminId: string) => `${id}${SEPARATOR}${adminId}`;

const txInfoToOperationAdapter =
  (accountId: string, partyId: string) =>
  (txInfo: OperationInfo): Operation => {
    const {
      asset: { instrumentId, instrumentAdmin },
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

    const used = !isCantonAccountEmpty({
      operationsCount: mainAccountOperations.length,
      balance: totalBalance,
      subAccounts,
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
      balance: totalBalance,
      blockHeight,
      creationDate,
      lastSyncDate: new Date(),
      freshAddress: address,
      seedIdentifier: address,
      operations: mainAccountOperations,
      operationsCount: mainAccountOperations.length,
      spendableBalance,
      subAccounts,
      xpub: xpubOrAddress,
      used,
      cantonResources,
    };

    return shape;
  };
}
