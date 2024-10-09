import { EthStakingProviders } from "~/types/featureFlags";

export type ListProviders = EthStakingProviders["listProvider"];
export type ListProvider = ListProviders[number];
