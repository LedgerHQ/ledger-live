import { throwIfAborted } from "@ledgerhq/coin-module-framework/promises";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import type { CantonCoinConfig, CantonContext } from "../config";
import {
  getCalTokensCached,
  getKey,
  getNativeInstrument,
  getOperations,
  getPendingTransferProposals,
  SEPARATOR,
  type OperationInfo,
  type TransferProposal,
} from "../network/gateway";
import type { AssetView } from "../types/gateway";
import { isInstrument, type NativeInstrument } from "./asset";
import { getInstrumentBalances, type CantonBalance } from "./instrumentBalances";
import { resumeOffset } from "./listOperations";
import { determineOperationType, type CantonOperationType } from "./operationType";
import { getMaxTxQuery, getMinReserve } from "../tuning";

export type ValidOperationInfo = OperationInfo & {
  asset: { type: "native" | "token"; instrumentId: string; instrumentAdmin: string };
  transfers: Array<{
    value: string;
    details?: { operationType?: string; metadata?: { reason?: string } };
  }>;
  senders: string[];
  recipients: string[];
};

export function isValidOperation(txInfo: OperationInfo): txInfo is ValidOperationInfo {
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

/** Operation types whose fee the account paid, so their value includes it. */
export const CHARGED_TYPES: ReadonlySet<CantonOperationType> = new Set(["OUT", "FEES"]);

/**
 * Operation types whose fee the account pays when it sends them. Creating a transfer proposal burns
 * its fee although the proposal moves no value.
 */
const PAYING_TYPES: ReadonlySet<CantonOperationType> = new Set([
  ...CHARGED_TYPES,
  "TRANSFER_PROPOSAL",
]);

/** A row's operation type and whether the party paid its fee. */
export function classifyPayment(row: ValidOperationInfo, partyId: string) {
  const [{ value, details }] = row.transfers;
  const type = determineOperationType(
    details?.operationType,
    row.type,
    value,
    row.senders,
    partyId,
  );
  const isPaid =
    PAYING_TYPES.has(type) && row.senders.includes(partyId) && new BigNumber(row.fee.value).gt(0);
  return { type, isPaid };
}

/** Whether the token gets a sub-account: listed in the CAL with an admin, and enabled. */
export const isTokenEnabled = (
  token: TokenCurrency,
  calTokens: Map<string, string>,
  enabledInstruments: ReadonlySet<string>,
): boolean => {
  const instrumentId = calTokens.get(token.id);
  const adminId = token.contractAddress;
  return !!instrumentId && !!adminId && enabledInstruments.has(getKey(instrumentId, adminId));
};

// So a node info outage doesn't fail every sync of an account an earlier sync classified.
async function getNativeInstrumentOrSaved(
  context: CantonContext,
  config: CantonCoinConfig,
  savedAdmin: string | undefined,
): Promise<NativeInstrument> {
  try {
    return await getNativeInstrument(config);
  } catch (error) {
    if (!savedAdmin) throw error;
    context.logger("canton/sync", "DSO party read failed, using the saved one", { error });
    return { instrumentId: config.nativeInstrumentId, instrumentAdmin: savedAdmin };
  }
}

type AggregatedBalance = {
  unlockedBalance: bigint;
  lockedBalance: bigint;
  utxoCount: number;
  token: TokenCurrency | null;
  adminId: string;
};

async function heldTokensByKey(
  calTokens: Map<string, string>,
  balances: CantonBalance[],
  signal: AbortSignal | undefined,
): Promise<Map<string, TokenCurrency>> {
  const heldInstrumentIds = new Set(balances.map(balance => balance.instrumentId));
  // Keyed by admin too: any party can issue an instrument under a CAL token's id.
  const tokensByKey = new Map<string, TokenCurrency>();
  // One CAL lookup at a time: on a cold cache, unbounded lookups exhaust the connection pool.
  const heldTokens = await [...calTokens.entries()]
    .filter(([, instrumentId]) => heldInstrumentIds.has(instrumentId))
    .reduce<Promise<{ instrumentId: string; token: TokenCurrency | undefined }[]>>(
      async (found, [tokenId, instrumentId]) => {
        const previous = await found;
        throwIfAborted(signal);
        const token = await getCryptoAssetsStore().findTokenById(tokenId);
        return [...previous, { instrumentId, token }];
      },
      Promise.resolve([]),
    );
  for (const { instrumentId, token } of heldTokens) {
    if (token?.contractAddress) {
      tokensByKey.set(getKey(instrumentId, token.contractAddress), token);
    }
  }
  return tokensByKey;
}

/** Aggregates the balances by instrument, unlocked and locked. */
function aggregateBalances(
  balances: CantonBalance[],
  nativeInstrument: NativeInstrument | undefined,
  nativeInstrumentId: string,
  tokensByKey: Map<string, TokenCurrency>,
): Map<string, AggregatedBalance> {
  const aggregatedBalances = new Map<string, AggregatedBalance>();
  for (const balance of balances) {
    const isNative =
      !!nativeInstrument && isInstrument(nativeInstrument, balance.instrumentId, balance.adminId);
    // Use just instrumentId for native (no admin), composite key for tokens
    const balanceKey = isNative
      ? nativeInstrumentId
      : getKey(balance.instrumentId, balance.adminId);
    const aggregated = aggregatedBalances.get(balanceKey) ?? {
      unlockedBalance: 0n,
      lockedBalance: 0n,
      utxoCount: 0,
      token: isNative ? null : (tokensByKey.get(balanceKey) ?? null),
      adminId: balance.adminId,
    };
    if (balance.isLocked) {
      aggregated.lockedBalance += balance.value;
    } else {
      aggregated.unlockedBalance += balance.value;
      // The gateway picks transfer inputs from unlocked holdings only.
      aggregated.utxoCount += balance.utxoCount;
    }
    aggregatedBalances.set(balanceKey, aggregated);
  }
  return aggregatedBalances;
}

/** The party's balances, pending transfer proposals and held CAL tokens, enabled or not. */
export async function readPartyBalances(
  context: CantonContext,
  currencyId: string,
  partyId: string,
  savedNativeInstrumentAdmin: string | undefined,
  signal: AbortSignal | undefined,
) {
  const config = await context.config();
  throwIfAborted(signal);
  const { nativeInstrumentId } = config;
  // Without a party there is nothing to classify, so a fresh account scans without it.
  const nativeInstrument = partyId
    ? await getNativeInstrumentOrSaved(context, config, savedNativeInstrumentAdmin)
    : undefined;
  throwIfAborted(signal);
  const balances = nativeInstrument
    ? await getInstrumentBalances(context, partyId, nativeInstrument)
    : [];
  throwIfAborted(signal);
  const pendingTransferProposals = partyId
    ? await getPendingTransferProposals(config, partyId)
    : [];

  const proposalInstrumentKeys = new Set(
    pendingTransferProposals.map(proposal =>
      getKey(proposal.instrument_id, proposal.instrument_admin),
    ),
  );
  for (const key of proposalInstrumentKeys) {
    const [instrumentId, adminId] = key.split(SEPARATOR);
    balances.push({
      value: 0n,
      locked: 0n,
      utxoCount: 0,
      isLocked: false,
      instrumentId,
      adminId,
      asset: { type: "token", assetReference: instrumentId },
    });
  }

  throwIfAborted(signal);
  const calTokens = await getCalTokensCached(config, currencyId);
  const tokensByKey = await heldTokensByKey(calTokens, balances, signal);
  const aggregatedBalances = aggregateBalances(
    balances,
    nativeInstrument,
    nativeInstrumentId,
    tokensByKey,
  );

  const nativeBalance = aggregatedBalances.get(nativeInstrumentId);
  const unlockedAmount = new BigNumber((nativeBalance?.unlockedBalance ?? 0n).toString());
  const lockedAmount = new BigNumber((nativeBalance?.lockedBalance ?? 0n).toString());
  const totalBalance = unlockedAmount.plus(lockedAmount);
  const reserveMin = new BigNumber(getMinReserve(config));
  const spendableBalance = BigNumber.max(0, unlockedAmount.minus(reserveMin));

  const instrumentUtxoCounts: Record<string, number> = {};
  for (const [key, data] of aggregatedBalances) {
    instrumentUtxoCounts[key] = data.utxoCount;
  }

  const tokenBalances = Array.from(aggregatedBalances.values()).flatMap(
    ({ unlockedBalance, lockedBalance, token, adminId }) =>
      token
        ? [
            {
              totalBalance: unlockedBalance + lockedBalance,
              spendableBalance: unlockedBalance,
              token,
              adminId,
            },
          ]
        : [],
  );

  return {
    nativeInstrument,
    totalBalance,
    spendableBalance,
    instrumentUtxoCounts,
    pendingTransferProposals,
    calTokens,
    tokenBalances,
  };
}

/** Whether the sync would give the party an operation on its main account. */
export async function hasNativeOperation(
  config: CantonCoinConfig,
  partyId: string,
  pendingTransferProposals: TransferProposal[],
  signal: AbortSignal | undefined,
): Promise<boolean> {
  const pendingUpdateIds = new Set(pendingTransferProposals.map(p => p.update_id));
  const isNativeInstrument = (asset: AssetView | undefined) =>
    !!asset && "instrumentId" in asset && asset.instrumentId === config.nativeInstrumentId;
  // A native fee the party paid becomes a native operation, of a pending row too.
  const isNative = (row: OperationInfo) =>
    isValidOperation(row) &&
    ((!pendingUpdateIds.has(row.transaction_hash) && isNativeInstrument(row.asset)) ||
      (classifyPayment(row, partyId).isPaid && isNativeInstrument(row.fee.asset)));
  let cursor: number | undefined;
  for (;;) {
    throwIfAborted(signal);
    const { operations, next } = await getOperations(config, partyId, {
      minOffset: 0,
      cursor,
      limit: getMaxTxQuery(config),
    });
    if (operations.some(isNative)) return true;
    if (next === undefined || next < 0) return false;
    cursor = resumeOffset(cursor ?? 0, operations, next);
  }
}
