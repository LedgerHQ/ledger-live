import { Account, TransactionCommon, TransactionStatusCommon } from "@ledgerhq/types-live";
import generated, { CoinModalsData } from "./generated";
import { LLDCoinFamily } from "./types";
import { MakeModalsType } from "../modals/types";

export function getLLDCoinFamily<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatusCommon
>(name: string): LLDCoinFamily<A, T, TS> {
  const f = generated[name as keyof typeof generated];
  if (!f) {
    throw new Error(`family ${name} not found`);
  }
  return f as LLDCoinFamily<A, T, TS>;
}

// families export their own modals

export const modals: MakeModalsType<CoinModalsData> = {};

for (const fam in generated) {
  const family = generated[fam as keyof typeof generated];
  const m = family.modals;
  if (!m) continue;
  const components = m;
  for (const name in components) {
    if (name in modals) {
      throw new Error(
        `modal ${name} already exists. Make sure there is no name collision between families.`,
      );
    }
    modals[name] = components[name as keyof typeof components];
  }
}
