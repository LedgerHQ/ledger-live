import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import type { CantonCoinConfig, CantonContext } from "../config";
import {
  getCalTokensCached,
  getEnabledInstrumentsCached,
  getKey,
  getOperations,
  getPendingTransferProposals,
  SEPARATOR,
  type OperationInfo,
  type TransferProposal,
} from "../network/gateway";
import { getBalance, type CantonBalance } from "./getBalance";

export type ValidOperationInfo = OperationInfo & {
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

/** The operations a party shows: valid ones, minus those still pending as a transfer proposal. */
export function filterOperations(
  transactions: OperationInfo[],
  pendingTransferProposals: TransferProposal[],
): ValidOperationInfo[] {
  const pendingUpdateIds = new Set(pendingTransferProposals.map(p => p.update_id));
  return transactions
    .filter(txInfo => !pendingUpdateIds.has(txInfo.transaction_hash))
    .filter(isValidOperation);
}

/** Keeps the tokens listed in the CAL whose instrument the gateway enables. */
export async function filterDisabledTokens<T extends { token: TokenCurrency }>(
  config: CantonCoinConfig,
  items: T[] | undefined,
  calTokens: Map<string, string>,
): Promise<T[]> {
  if (!items || items.length === 0) {
    return [];
  }

  const enabledInstruments = await getEnabledInstrumentsCached(config);
  return items.filter(({ token }) => {
    const instrumentId = calTokens.get(token.id);
    const adminId = token.contractAddress;
    if (!instrumentId || !adminId) {
      return false;
    }

    return enabledInstruments.has(getKey(instrumentId, adminId));
  });
}

export type PartyTokenBalance = {
  totalBalance: bigint;
  spendableBalance: bigint;
  token: TokenCurrency;
  adminId: string;
};

/** Whether a party holds anything: a native operation or balance, an enabled token, a pending proposal. */
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

/** An empty token balance per instrument with a pending transfer proposal, so the party shows it. */
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

/** The CAL token of each balance instrument, by instrument key. */
async function resolveTokens(
  balances: CantonBalance[],
  calTokens: Map<string, string>,
): Promise<Map<string, TokenCurrency>> {
  const tokenIdentifierToId = new Map<string, string>();
  for (const [tokenId, tokenIdentifier] of calTokens.entries()) {
    tokenIdentifierToId.set(tokenIdentifier, tokenId);
  }

  const tokensByKey = new Map<string, TokenCurrency>();
  for (const balance of balances) {
    const tokenId = tokenIdentifierToId.get(balance.instrumentId) ?? "";
    const token = await getCryptoAssetsStore().findTokenById(tokenId);
    if (token) tokensByKey.set(getKey(balance.instrumentId, balance.adminId), token);
  }
  return tokensByKey;
}

/** Sums balances by instrument (unlocked + locked); the native one is keyed by its instrument id alone. */
function aggregateBalances(
  balances: CantonBalance[],
  nativeInstrumentId: string,
  tokensByKey: Map<string, TokenCurrency>,
): Map<string, AggregatedBalance> {
  const aggregatedBalances = new Map<string, AggregatedBalance>();
  for (const balance of balances) {
    const isNative = balance.instrumentId === nativeInstrumentId;
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
  minReserve: number | undefined,
) {
  const nativeBalance = Array.from(aggregatedBalances.values()).find(data => data.token === null);
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

/** What a party holds on chain; `partyId` is empty for a key not onboarded. */
export async function readPartyState(
  context: CantonContext,
  currencyId: string,
  partyId: string,
  { cursor = 0, signal }: { cursor?: number; signal?: AbortSignal } = {},
) {
  const config = await context.config();
  const { nativeInstrumentId } = config;
  signal?.throwIfAborted();
  const balances = partyId ? await getBalance(context, partyId) : [];
  signal?.throwIfAborted();
  const pendingTransferProposals = partyId
    ? await getPendingTransferProposals(config, partyId)
    : [];
  balances.push(...proposalInstrumentBalances(pendingTransferProposals));

  signal?.throwIfAborted();
  const calTokens = await getCalTokensCached(currencyId);
  const tokensByKey = await resolveTokens(balances, calTokens);
  const aggregatedBalances = aggregateBalances(balances, nativeInstrumentId, tokensByKey);
  const { totalBalance, spendableBalance } = nativeBalances(aggregatedBalances, config.minReserve);

  const instrumentUtxoCounts: Record<string, number> = {};
  for (const [key, data] of aggregatedBalances) {
    instrumentUtxoCounts[key] = data.utxoCount;
  }

  let operations: ValidOperationInfo[] = [];
  if (partyId) {
    signal?.throwIfAborted();
    const transactionData = await getOperations(config, partyId, { cursor, limit: 100 });
    operations = filterOperations(transactionData.operations, pendingTransferProposals);
  }

  signal?.throwIfAborted();
  const enabledTokenBalances = await filterDisabledTokens(
    config,
    tokenBalancesOf(aggregatedBalances),
    calTokens,
  );

  return {
    totalBalance,
    spendableBalance,
    instrumentUtxoCounts,
    pendingTransferProposals,
    calTokens,
    operations,
    tokenBalances: enabledTokenBalances,
  };
}
