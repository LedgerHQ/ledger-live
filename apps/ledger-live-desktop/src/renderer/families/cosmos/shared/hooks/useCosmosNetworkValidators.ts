import { useMemo } from "react";
import { useNetworkValidators } from "@domain/api-network-validators";
import { networkFromCurrencyId } from "@domain/entity-account-descriptor";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { NetworkValidator } from "@domain/entity-network-validators";
import type { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";

export const toCosmosValidatorItem = (validator: NetworkValidator): CosmosValidatorItem => ({
  validatorAddress: validator.id,
  name: validator.name,
  votingPower: 0,
  // NaN when unknown: the row shows a dash instead of a 0% commission.
  commission: validator.commission ?? Number.NaN,
  estimatedYearlyRewardsRate: validator.apy ?? 0,
  tokens: validator.totalStaked ?? "0",
});

const byTotalStakedDesc = (a: NetworkValidator, b: NetworkValidator) => {
  const diff = BigInt(b.totalStaked ?? "0") - BigInt(a.totalStaked ?? "0");
  if (diff === 0n) return 0;
  return diff > 0n ? 1 : -1;
};

/** Pickable validators (a full commission is left out) matching the search, Ledger's first, then by stake. */
export function ledgerFirstValidators(
  validators: readonly NetworkValidator[],
  search = "",
): CosmosValidatorItem[] {
  const query = search.toLowerCase();
  const pickable = validators
    .filter(({ commission, name }) => commission !== 1 && name.toLowerCase().includes(query))
    .sort(byTotalStakedDesc);
  return [
    ...pickable.filter(({ isLedger }) => isLedger),
    ...pickable.filter(({ isLedger }) => !isLedger),
  ].map(toCosmosValidatorItem);
}

/** The network's validators, read when the screen mounts, in the shape the Cosmos components take. */
export function useCosmosNetworkValidators(currency: CryptoCurrency) {
  const { validators, pending, error } = useNetworkValidators(networkFromCurrencyId(currency.id));
  const items = useMemo(() => validators.map(toCosmosValidatorItem), [validators]);
  return { validators: items, pending, error };
}

/** The network's validators to pick from: see `ledgerFirstValidators`. */
export function useLedgerFirstCosmosValidators(currency: CryptoCurrency, search?: string) {
  const { validators } = useNetworkValidators(networkFromCurrencyId(currency.id));
  return useMemo(() => ledgerFirstValidators(validators, search), [validators, search]);
}

/** Ids of the validators Ledger runs on the network, empty until the validators are read. */
export function useCosmosLedgerValidatorIds(currency: CryptoCurrency): readonly string[] {
  const { validators } = useNetworkValidators(networkFromCurrencyId(currency.id));
  return useMemo(
    () => validators.filter(({ isLedger }) => isLedger).map(({ id }) => id),
    [validators],
  );
}
