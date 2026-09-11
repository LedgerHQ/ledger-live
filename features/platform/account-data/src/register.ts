import type { AccountBalanceSource } from "./source";

let sources: readonly AccountBalanceSource[] = [];

export function registerAccountBalanceSources(next: readonly AccountBalanceSource[]): void {
  sources = Object.freeze([...next]);
}

export function getAccountBalanceSources(): readonly AccountBalanceSource[] {
  return sources;
}
