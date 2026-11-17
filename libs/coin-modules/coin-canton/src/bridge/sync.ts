import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { Operation, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CantonCoinConfig, CantonContext } from "../config";
import { isCantonAccountEmpty } from "../helpers";
import { getInstrumentBalances } from "./instrumentBalances";
import { determineOperationType } from "../logic/operationType";
import {
  getCalTokensCached,
  getEnabledInstrumentsCached,
  getKey,
  getLedgerEnd,
  getOperations,
  getPartyById,
  getPendingTransferProposals,
  SEPARATOR,
  type OperationInfo,
  type TransferProposal,
} from "../network/gateway";
import resolver from "../signer";
import { CantonAccount, CantonResources, CantonSigner } from "../types";
import { buildSubAccounts } from "./buildSubAccounts";
import { getCurrencyContext } from "./context";
import { isAccountOnboarded } from "./onboard";

type ValidOperationInfo = OperationInfo & {
  asset: { type: "native" | "token"; instrumentId: string; instrumentAdmin: string };
  transfers: Array<{
    value: string;
    details?: { operationType?: string; metadata?: { reason?: string } };
  }>;
  senders: string[];
  recipients: string[];
};

function isValidOperation(txInfo: OperationInfo): txInfo is ValidOperationInfo {
  return (
    txInfo.asset !== undefined &&
    (txInfo.asset.type === "native" || txInfo.asset.type === "token") &&
    typeof txInfo.asset.instrumentId === "string" &&
    typeof txInfo.asset.instrumentAdmin === "string" &&
    txInfo.transfers !== undefined &&
    txInfo.transfers.length > 0 &&
    txInfo.senders !== undefined &&
    txInfo.recipients !== undefined
  );
}

const txInfoToOperationAdapter =
  (accountId: string, partyId: string) =>
  (txInfo: ValidOperationInfo): Operation => {
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

    const type = determineOperationType(
      details?.operationType,
      txInfo.type,
      transferValue,
      senders,
      partyId,
    );

    let value = new BigNumber(transferValue);

    if (type === "OUT" || type === "FEES") {
      value = value.plus(fee);
    }

    const feeValue = new BigNumber(fee);
    const memo = details?.metadata?.reason;

    const op: Operation = {
      id: encodeOperationId(accountId, transaction_hash, type),
      hash: transaction_hash,
      accountId,
      type,
      value,
      fee: feeValue,
      blockHash: hash ?? "",
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
  pendingTransferProposals: TransferProposal[],
): Operation[] => {
  const pendingUpdateIds = new Set(pendingTransferProposals.map(p => p.update_id));

  return transactions
    .filter(txInfo => !pendingUpdateIds.has(txInfo.transaction_hash))
    .filter(isValidOperation)
    .map(txInfoToOperationAdapter(accountId, partyId));
};

export async function filterDisabledTokenAccounts(
  config: CantonCoinConfig,
  subAccounts: TokenAccount[] | undefined,
  calTokens: Map<string, string>,
): Promise<TokenAccount[]> {
  if (!subAccounts || subAccounts.length === 0) {
    return [];
  }

  const enabledInstruments = await getEnabledInstrumentsCached(config);
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
  context: CantonContext,
): GetAccountShape<CantonAccount> {
  return async info => {
    const { address, currency, derivationMode, derivationPath, initialAccount } = info;
    const config = await context.config(currency.id);

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

      const result = await isAccountOnboarded(config, publicKey);
      isOnboarded = result.isOnboarded;

      if (isOnboarded && result.partyId) {
        xpubOrAddress = result.partyId;
      }
    }

    // Backfill publicKey for an already-onboarded account (xpub present but no
    // publicKey — e.g. synced before publicKey was captured). Deviceless: the
    // gateway party lookup returns it. Without publicKey, validateTopology can't
    // run and the topology-change prompt never shows. LIVE-34585
    if (xpubOrAddress && !publicKey) {
      const { public_key } = await getPartyById(config, xpubOrAddress);
      if (public_key) publicKey = public_key;
    }

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: xpubOrAddress,
      derivationMode,
    });

    const { nativeInstrumentId } = config;
    const balances = xpubOrAddress
      ? await getInstrumentBalances(getCurrencyContext(context, currency), xpubOrAddress)
      : [];
    const pendingTransferProposals = xpubOrAddress
      ? await getPendingTransferProposals(config, xpubOrAddress)
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

    const calTokens = await getCalTokensCached(currency.id);
    const heldInstrumentIds = new Set(balances.map(balance => balance.instrumentId));
    // Keyed by admin too: any party can issue an instrument under a CAL token's id.
    const tokensByKey = new Map<string, TokenCurrency>();
    for (const [tokenId, instrumentId] of calTokens.entries()) {
      if (!heldInstrumentIds.has(instrumentId)) continue;
      const token = await getCryptoAssetsStore().findTokenById(tokenId);
      if (token?.contractAddress) {
        tokensByKey.set(getKey(instrumentId, token.contractAddress), token);
      }
    }

    for await (const balance of balances) {
      const isNative = balance.instrumentId === nativeInstrumentId;
      // Use just instrumentId for native (no admin), composite key for tokens
      const balanceKey = isNative
        ? nativeInstrumentId
        : getKey(balance.instrumentId, balance.adminId);
      const token: TokenCurrency | null = isNative ? null : (tokensByKey.get(balanceKey) ?? null);

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

    const nativeBalance = aggregatedBalances.get(nativeInstrumentId);
    const unlockedAmount = new BigNumber((nativeBalance?.unlockedBalance ?? 0n).toString());
    const lockedAmount = new BigNumber((nativeBalance?.lockedBalance ?? 0n).toString());
    const totalBalance = unlockedAmount.plus(lockedAmount);
    const reserveMin = new BigNumber(config.minReserve || 0);
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
      const transactionData = await getOperations(config, xpubOrAddress, {
        cursor: startAt,
        limit: 100,
      });
      const newOperations = filterOperations(
        transactionData.operations,
        accountId,
        xpubOrAddress,
        pendingTransferProposals,
      );

      operations = mergeOps(oldOperations, newOperations);
    }

    // Filter main account operations (native instrument only)
    const mainAccountOperations = operations.filter(op => {
      const extra = op.extra as { instrumentId?: string };
      return extra?.instrumentId === nativeInstrumentId;
    });

    // Build sub-accounts for tokens with their filtered operations
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
      pendingTransferProposals,
      ...(publicKey ? { publicKey } : {}),
      xpub: xpubOrAddress,
    };

    const filteredSubAccounts = await filterDisabledTokenAccounts(config, subAccounts, calTokens);

    const used = !isCantonAccountEmpty({
      operationsCount: mainAccountOperations.length,
      balance: totalBalance,
      subAccounts: filteredSubAccounts,
      cantonResources,
    });

    const blockHeight = await getLedgerEnd(config);

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
      subAccounts: filteredSubAccounts,
      xpub: xpubOrAddress,
      used,
      cantonResources,
    };

    return shape;
  };
}
