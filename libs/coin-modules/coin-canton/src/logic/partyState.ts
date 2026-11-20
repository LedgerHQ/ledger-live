import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import type { CantonCoinConfig, CantonContext } from "../config";
import {
  getCalTokensCached,
  getEnabledInstrumentsCached,
  getKey,
  getNativeInstrument,
  getOperations,
  getPendingTransferProposals,
  SEPARATOR,
  type OperationInfo,
  type TransferProposal,
} from "../network/gateway";
import { isInstrument, type NativeInstrument } from "./asset";
import { resumeOffset } from "./listOperations";
import { getInstrumentBalances, type CantonBalance } from "./instrumentBalances";

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

const OPERATIONS_PAGE_SIZE = 1_000;

// The sync's main account operations: settled, valid and of the native instrument.
async function hasNativeOperation(
  config: CantonCoinConfig,
  partyId: string,
  pendingTransferProposals: TransferProposal[],
  signal: AbortSignal | undefined,
): Promise<boolean> {
  const pendingUpdateIds = new Set(pendingTransferProposals.map(p => p.update_id));
  const isNative = (row: OperationInfo) =>
    !pendingUpdateIds.has(row.transaction_hash) &&
    isValidOperation(row) &&
    row.asset.instrumentId === config.nativeInstrumentId;
  let cursor: number | undefined;
  for (;;) {
    signal?.throwIfAborted();
    const { operations, next } = await getOperations(config, partyId, {
      minOffset: 0,
      cursor,
      limit: OPERATIONS_PAGE_SIZE,
    });
    if (operations.some(isNative)) return true;
    if (next === undefined || next < 0) return false;
    cursor = resumeOffset(cursor ?? 0, operations, next);
  }
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

export type PartyTokenBalance = {
  totalBalance: bigint;
  spendableBalance: bigint;
  token: TokenCurrency;
  adminId: string;
};

export function isPartyUsed({
  nativeOperationsCount,
  totalBalance,
  tokensCount,
  pendingTransferProposals,
}: {
  nativeOperationsCount: number;
  totalBalance: BigNumber;
  tokensCount: number;
  pendingTransferProposals: TransferProposal[];
}): boolean {
  return (
    nativeOperationsCount > 0 ||
    !totalBalance.isZero() ||
    tokensCount > 0 ||
    pendingTransferProposals.length > 0
  );
}

type AggregatedBalance = {
  unlockedBalance: bigint;
  lockedBalance: bigint;
  utxoCount: number;
  token: TokenCurrency | null;
  adminId: string;
};

// A pending transfer proposal shows its token, with an empty balance.
function proposalInstrumentBalances(pendingTransferProposals: TransferProposal[]): CantonBalance[] {
  const proposalInstrumentKeys = new Set(
    pendingTransferProposals.map(proposal =>
      getKey(proposal.instrument_id, proposal.instrument_admin),
    ),
  );
  return Array.from(proposalInstrumentKeys, key => {
    const [instrumentId, adminId] = key.split(SEPARATOR);
    return {
      value: 0n,
      locked: 0n,
      utxoCount: 0,
      instrumentId,
      adminId,
      asset: { type: "token", assetReference: instrumentId },
    };
  });
}

async function resolveTokens(
  balances: CantonBalance[],
  calTokens: Map<string, string>,
  signal: AbortSignal | undefined,
): Promise<Map<string, TokenCurrency>> {
  const heldInstrumentIds = new Set(balances.map(balance => balance.instrumentId));
  signal?.throwIfAborted();
  // Keyed by admin too: any party can issue an instrument under a CAL token's id.
  const tokens = await Promise.all(
    [...calTokens.entries()]
      .filter(([, instrumentId]) => heldInstrumentIds.has(instrumentId))
      .map(async ([tokenId, instrumentId]) => {
        const token = await getCryptoAssetsStore().findTokenById(tokenId);
        return token?.contractAddress
          ? ([getKey(instrumentId, token.contractAddress), token] as const)
          : undefined;
      }),
  );
  signal?.throwIfAborted();
  const tokensByKey = new Map<string, TokenCurrency>();
  for (const entry of tokens) if (entry) tokensByKey.set(entry[0], entry[1]);
  return tokensByKey;
}

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
    const balanceKey = isNative
      ? nativeInstrumentId
      : getKey(balance.instrumentId, balance.adminId);
    const token = isNative ? null : (tokensByKey.get(balanceKey) ?? null);
    const unlocked = balance.locked ? 0n : balance.value;
    const locked = balance.locked ? balance.value : 0n;

    const existing = aggregatedBalances.get(balanceKey);
    if (existing) {
      existing.unlockedBalance += unlocked;
      existing.lockedBalance += locked;
      existing.utxoCount += balance.utxoCount;
    } else {
      aggregatedBalances.set(balanceKey, {
        unlockedBalance: unlocked,
        lockedBalance: locked,
        utxoCount: balance.utxoCount,
        token,
        adminId: balance.adminId,
      });
    }
  }
  return aggregatedBalances;
}

function nativeBalances(
  aggregatedBalances: Map<string, AggregatedBalance>,
  nativeInstrumentId: string,
  minReserve: number | undefined,
) {
  const nativeBalance = aggregatedBalances.get(nativeInstrumentId);
  const unlockedAmount = new BigNumber((nativeBalance?.unlockedBalance ?? 0n).toString());
  const lockedAmount = new BigNumber((nativeBalance?.lockedBalance ?? 0n).toString());
  const reserveMin = new BigNumber(minReserve || 0);
  return {
    totalBalance: unlockedAmount.plus(lockedAmount),
    spendableBalance: BigNumber.max(0, unlockedAmount.minus(reserveMin)),
  };
}

function tokenBalancesOf(aggregatedBalances: Map<string, AggregatedBalance>): PartyTokenBalance[] {
  const tokenBalances: PartyTokenBalance[] = [];
  for (const { unlockedBalance, lockedBalance, token, adminId } of aggregatedBalances.values()) {
    if (token === null) continue;
    tokenBalances.push({
      totalBalance: unlockedBalance + lockedBalance,
      spendableBalance: unlockedBalance,
      token,
      adminId,
    });
  }
  return tokenBalances;
}

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

type ReadOptions = {
  signal?: AbortSignal | undefined;
  savedNativeInstrumentAdmin?: string | undefined;
};

/** The party's balances, pending transfer proposals and held CAL tokens, enabled or not. */
export async function readPartyBalances(
  context: CantonContext,
  currencyId: string,
  partyId: string,
  { signal, savedNativeInstrumentAdmin }: ReadOptions = {},
) {
  const config = await context.config();
  const { nativeInstrumentId } = config;
  signal?.throwIfAborted();
  // Without a party there is nothing to classify, so a fresh account scans without it.
  const nativeInstrument = partyId
    ? await getNativeInstrumentOrSaved(context, config, savedNativeInstrumentAdmin)
    : undefined;
  signal?.throwIfAborted();
  const balances = nativeInstrument
    ? await getInstrumentBalances(context, partyId, nativeInstrument)
    : [];
  signal?.throwIfAborted();
  const pendingTransferProposals = partyId
    ? await getPendingTransferProposals(config, partyId)
    : [];
  balances.push(...proposalInstrumentBalances(pendingTransferProposals));

  signal?.throwIfAborted();
  const calTokens = await getCalTokensCached(currencyId);
  const tokensByKey = await resolveTokens(balances, calTokens, signal);
  const aggregatedBalances = aggregateBalances(
    balances,
    nativeInstrument,
    nativeInstrumentId,
    tokensByKey,
  );
  const { totalBalance, spendableBalance } = nativeBalances(
    aggregatedBalances,
    nativeInstrumentId,
    config.minReserve,
  );

  const instrumentUtxoCounts: Record<string, number> = {};
  for (const [key, data] of aggregatedBalances) {
    instrumentUtxoCounts[key] = data.utxoCount;
  }

  return {
    nativeInstrument,
    totalBalance,
    spendableBalance,
    instrumentUtxoCounts,
    pendingTransferProposals,
    calTokens,
    tokenBalances: tokenBalancesOf(aggregatedBalances),
  };
}

/** The party's balances, enabled tokens and whether it has a settled native operation. */
export async function readPartyState(
  context: CantonContext,
  currencyId: string,
  partyId: string,
  options: ReadOptions = {},
) {
  const { signal } = options;
  const config = await context.config();
  const state = await readPartyBalances(context, currencyId, partyId, options);

  const hasNativeOperations = partyId
    ? await hasNativeOperation(config, partyId, state.pendingTransferProposals, signal)
    : false;

  signal?.throwIfAborted();
  const enabledInstruments =
    state.tokenBalances.length > 0 ? await getEnabledInstrumentsCached(config) : new Set<string>();
  const tokenBalances = state.tokenBalances.filter(({ token }) =>
    isTokenEnabled(token, state.calTokens, enabledInstruments),
  );

  return { ...state, hasNativeOperations, tokenBalances };
}
