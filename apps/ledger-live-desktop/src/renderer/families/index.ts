import { Account, TransactionCommon, TransactionStatusCommon } from "@ledgerhq/types-live";
import generated from "./generated";
import { Modals, LLDCoinFamily } from "./types";

export function getLLDCoinFamily<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatusCommon
>(name: string): LLDCoinFamily<A, T, TS> {
  const f = generated[name];
  if (!f) {
    throw new Error(`family ${name} not found`);
  }
  return f;
}

// families export their own modals

export const modals: Modals = {};

for (const fam in generated) {
  const family = generated[fam];
  const m = family.modals;
  if (!m) continue;
  const components = m;
  for (const name in components) {
    if (name in modals) {
      throw new Error(
        `modal ${name} already exists. Make sure there is no name collision between families.`,
      );
    }
    modals[name] = components[name];
  }
}
