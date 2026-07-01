import type { Transaction } from "../../../coin-modules/transaction-types";

type FeesStrategy = NonNullable<Transaction["feesStrategy"]>;

const FEES_STRATEGIES: ReadonlySet<string> = new Set<FeesStrategy>([
  "slow",
  "medium",
  "fast",
  "custom",
]);

export function isFeesStrategy(strategy: string): strategy is FeesStrategy {
  return FEES_STRATEGIES.has(strategy);
}

export function asFeesStrategy(strategy: string): FeesStrategy | null {
  return isFeesStrategy(strategy) ? strategy : null;
}
