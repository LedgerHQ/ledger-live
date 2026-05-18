import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { buildMultiCV, resetOperationIdCounter, USD } from "@ledgerhq/wallet-pnl/scenarios";
import { computeAssetPnL, computePortfolioPnL, invalidatePnLCache } from "@ledgerhq/wallet-pnl";
import { toMajor, ZERO_ASSET_PNL, ZERO_PORTFOLIO_PNL } from "../../../shared/formatting";
import {
  prepareAccount,
  ZERO_RESULT,
  type PreparedAccount,
  type TraderResult,
} from "./computeAccount";
import type { AssetDescriptor, TraderAccountState, TraderAssetId } from "./types";

export type TraderPortfolioTotals = {
  costBasis: BigNumber;
  realisedPnL: BigNumber;
  unrealisedPnL: BigNumber;
  totalPnL: BigNumber;
};

export const ZERO_PORTFOLIO_TOTALS: TraderPortfolioTotals = {
  costBasis: new BigNumber(0),
  realisedPnL: new BigNumber(0),
  unrealisedPnL: new BigNumber(0),
  totalPnL: new BigNumber(0),
};

export type TraderPortfolioResult = {
  perAccount: Map<string, TraderResult>;
  totals: TraderPortfolioTotals;
};

type MergedPair = {
  asset: AssetDescriptor;
  history: Record<string, number>;
  latest: number | undefined;
};

/**
 * Same asset across multiple accounts collapses to a single CV entry. Latest
 * price is "last write wins" (deterministic by list order).
 */
function mergePairsByAsset(prepared: PreparedAccount[]): Map<TraderAssetId, MergedPair> {
  const merged = new Map<TraderAssetId, MergedPair>();
  for (const p of prepared) {
    const existing = merged.get(p.asset.id);
    if (existing) {
      Object.assign(existing.history, p.history);
      if (p.latestUsd.isPositive()) existing.latest = p.latestUsd.toNumber();
    } else {
      merged.set(p.asset.id, {
        asset: p.asset,
        history: { ...p.history },
        latest: p.latestUsd.isPositive() ? p.latestUsd.toNumber() : undefined,
      });
    }
  }
  return merged;
}

/** Empty accounts (no valid rows) get a zeroed result so the UI can still render them. */
export function computeTraderPortfolio(accounts: TraderAccountState[]): TraderPortfolioResult {
  const perAccount = new Map<string, TraderResult>();
  for (const a of accounts) perAccount.set(a.id, ZERO_RESULT);

  const prepared = accounts
    .map(a => prepareAccount(a))
    .filter((p): p is PreparedAccount => p !== null);
  if (prepared.length === 0) {
    return { perAccount, totals: ZERO_PORTFOLIO_TOTALS };
  }

  invalidatePnLCache();
  resetOperationIdCounter();

  const cv = buildMultiCV(
    Array.from(mergePairsByAsset(prepared).values()).map(m => ({
      pair: { from: m.asset.currency, to: USD },
      history: m.history,
      latest: m.latest,
    })),
  );

  for (const p of prepared) {
    const pnl = toMajor(computeAssetPnL(p.account, cv, USD), USD, ZERO_ASSET_PNL);
    perAccount.set(p.state.id, {
      ...p.counts,
      finalBalanceAtomic: p.finalBalanceAtomic,
      costBasis: pnl.costBasis,
      realisedPnL: pnl.realisedPnL,
      unrealisedPnL: pnl.unrealisedPnL,
      totalPnL: pnl.totalPnL,
    });
  }

  invalidatePnLCache();
  const portfolioAccounts: AccountLike[] = prepared.map(p => p.account);
  const portfolio = toMajor(
    computePortfolioPnL(portfolioAccounts, cv, USD),
    USD,
    ZERO_PORTFOLIO_PNL,
  );

  return {
    perAccount,
    totals: {
      costBasis: portfolio.costBasis,
      realisedPnL: portfolio.realisedPnL,
      unrealisedPnL: portfolio.unrealisedPnL,
      totalPnL: portfolio.totalPnL,
    },
  };
}
