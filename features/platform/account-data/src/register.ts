import type { AccountBalanceSource } from "./source";
import type { AccountOperationsSource } from "./operations";

let balanceSources: readonly AccountBalanceSource[] = [];
let operationsSources: readonly AccountOperationsSource[] = [];

export function registerAccountBalanceSources(next: readonly AccountBalanceSource[]): void {
  balanceSources = Object.freeze([...next]);
}

export function getAccountBalanceSources(): readonly AccountBalanceSource[] {
  return balanceSources;
}

export function registerAccountOperationsSources(next: readonly AccountOperationsSource[]): void {
  operationsSources = Object.freeze([...next]);
}

export function getAccountOperationsSources(): readonly AccountOperationsSource[] {
  return operationsSources;
}
