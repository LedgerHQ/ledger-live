import type {
  Balance,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";

/**
 * Consumers outside Ledger Live (e.g. coin-service over JSON) pass amounts as decimal strings or
 * numbers where the contract says `bigint`. The API normalizes them once, so the logic only ever
 * sees bigints.
 */
export function toBigInt(value: unknown, field: string): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === "string" && /^-?\d+$/.test(value)) return BigInt(value);
  throw new Error(`${field} must be an integer amount`);
}

/** Numeric fee parameters the module reads. */
const NUMERIC_PARAMETERS = ["feePerByte", "amount"];

function normalizeParameters(parameters: FeeEstimation["parameters"]): FeeEstimation["parameters"] {
  if (!parameters) return parameters;
  const normalized: Record<string, unknown> = { ...parameters };
  for (const key of NUMERIC_PARAMETERS) {
    if (normalized[key] !== undefined) normalized[key] = toBigInt(normalized[key], key);
  }
  return normalized;
}

export function normalizeIntent<I extends TransactionIntent>(intent: I): I {
  return { ...intent, amount: toBigInt(intent.amount ?? 0n, "amount") };
}

export function normalizeFees(customFees?: FeeEstimation): FeeEstimation | undefined {
  if (!customFees) return customFees;
  const parameters = normalizeParameters(customFees.parameters);
  return {
    ...customFees,
    value: toBigInt(customFees.value ?? 0n, "customFees.value"),
    ...(parameters ? { parameters } : {}),
  };
}

export function normalizeFeeParameters(
  parameters: FeeEstimation["parameters"],
): FeeEstimation["parameters"] {
  return normalizeParameters(parameters);
}

export function normalizeBalances(balances: Balance[]): Balance[] {
  return balances.map(balance => ({
    ...balance,
    value: toBigInt(balance.value, "balance"),
    ...(balance.locked === undefined ? {} : { locked: toBigInt(balance.locked, "locked") }),
  }));
}
