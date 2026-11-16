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

/** The network's validators, read when the screen mounts, in the shape the Cosmos components take. */
export function useCosmosNetworkValidators(currency: CryptoCurrency) {
  const { validators, pending, error } = useNetworkValidators(networkFromCurrencyId(currency.id));
  const items = useMemo(() => validators.map(toCosmosValidatorItem), [validators]);
  return { validators: items, pending, error };
}
