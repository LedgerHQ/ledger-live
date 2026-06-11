import type { OperationType } from "@ledgerhq/types-live";

/**
 * Operation-type labels resolve from the shared `operation.type.<TYPE>` map. When a family needs a
 * different wording for an otherwise-shared type — e.g. Tezos renders `UNSTAKE` as "Unstaking" (it
 * stays pending ~4 days) while Aptos/Near keep the shared "Unstaked" — it defines
 * `<family>.operationTypes.<TYPE>`. We try that family key first and fall back to the shared label,
 * so every other family is unaffected.
 */
export function getOperationTypeI18nKey(type: OperationType, family?: string): string | string[] {
  return family
    ? [`${family}.operationTypes.${type}`, `operation.type.${type}`]
    : `operation.type.${type}`;
}
