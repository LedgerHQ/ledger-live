import BigNumber from "bignumber.js";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import {
  buildCV,
  dailyHistory,
  makeAccount,
  makeTokenAccount,
  resetOperationIdCounter,
  USD,
} from "@ledgerhq/wallet-pnl/scenarios";
import { computeAssetPnL, invalidatePnLCache } from "@ledgerhq/wallet-pnl";
import { parseBn, toMajor, ZERO_ASSET_PNL } from "../../../shared/formatting";
import { getAsset } from "./assets";
import {
  computeFinalBalanceAtomic,
  countByKind,
  makeOperation,
  parseRows,
  type ParsedRow,
} from "./parseRows";
import type { AssetDescriptor, TraderAccountState } from "./types";

export type TraderResult = {
  inCount: number;
  outCount: number;
  feesCount: number;
  finalBalanceAtomic: BigNumber;
  costBasis: BigNumber;
  realisedPnL: BigNumber;
  unrealisedPnL: BigNumber;
  totalPnL: BigNumber;
};

export const ZERO_RESULT: TraderResult = {
  inCount: 0,
  outCount: 0,
  feesCount: 0,
  finalBalanceAtomic: new BigNumber(0),
  costBasis: new BigNumber(0),
  realisedPnL: new BigNumber(0),
  unrealisedPnL: new BigNumber(0),
  totalPnL: new BigNumber(0),
};

export type PreparedAccount = {
  state: TraderAccountState;
  asset: AssetDescriptor;
  account: Account | TokenAccount;
  history: Record<string, number>;
  latestUsd: BigNumber;
  finalBalanceAtomic: BigNumber;
  counts: { inCount: number; outCount: number; feesCount: number };
};

function buildAccount(
  asset: AssetDescriptor,
  accountId: string,
  operations: Operation[],
  balance: BigNumber,
): Account | TokenAccount {
  if (asset.isToken) {
    return makeTokenAccount(asset.currency, { id: accountId, operations, balance });
  }
  return makeAccount(asset.currency, { id: accountId, operations, balance });
}

/**
 * Builds the framework Account + history + latest price for one editable
 * state. Returns `null` when there's nothing computable (no valid rows).
 */
export function prepareAccount(state: TraderAccountState): PreparedAccount | null {
  const asset = getAsset(state.assetId);
  const parsed = parseRows(state.rows, asset.atomicScale);
  if (parsed.length === 0) return null;

  // Stable order avoids cost-basis drift when the user reorders inputs in the UI.
  const chronological: ParsedRow[] = [...parsed].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const operations = chronological.map(makeOperation);
  const finalBalanceAtomic = computeFinalBalanceAtomic(chronological);
  const account = buildAccount(
    asset,
    `js:2:${asset.currency.id}:trader-${state.id}:`,
    operations,
    finalBalanceAtomic,
  );

  const history = dailyHistory(chronological.map(r => [r.date, r.priceUsd.toNumber()]));
  const parsedLatest = parseBn(state.currentPriceUsd);
  const latestUsd = parsedLatest.isPositive() ? parsedLatest : new BigNumber(0);

  return {
    state,
    asset,
    account,
    history,
    latestUsd,
    finalBalanceAtomic,
    counts: countByKind(chronological),
  };
}

export function computeTraderAccount(state: TraderAccountState): TraderResult {
  const prepared = prepareAccount(state);
  if (!prepared) return ZERO_RESULT;

  invalidatePnLCache();
  resetOperationIdCounter();

  const cv = buildCV({
    pair: { from: prepared.asset.currency, to: USD },
    history: prepared.history,
    latest: prepared.latestUsd.isPositive() ? prepared.latestUsd.toNumber() : undefined,
  });

  const pnl = toMajor(computeAssetPnL(prepared.account, cv, USD), USD, ZERO_ASSET_PNL);

  return {
    ...prepared.counts,
    finalBalanceAtomic: prepared.finalBalanceAtomic,
    costBasis: pnl.costBasis,
    realisedPnL: pnl.realisedPnL,
    unrealisedPnL: pnl.unrealisedPnL,
    totalPnL: pnl.totalPnL,
  };
}
