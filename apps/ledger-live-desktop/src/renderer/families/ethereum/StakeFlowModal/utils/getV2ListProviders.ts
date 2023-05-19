import { EthStakingProviders } from "~/types/featureFlags";
import { ProvidersV2 } from "../types";

export function getV2ListProviders(
  listProviders: EthStakingProviders["listProvider"] = [],
): ProvidersV2 {
  if (listProviders.length === 0) {
    return [];
  }

  return listProviders.reduce<ProvidersV2>((result, provider) => {
    if ("id" in provider) {
      return [...result, provider];
    }
    return result;
  }, []);
}
