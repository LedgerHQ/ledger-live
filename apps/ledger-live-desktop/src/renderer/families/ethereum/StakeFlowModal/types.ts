import { EthStakingProviders } from "~/types/featureFlags";

export type ListProviders = EthStakingProviders["listProvider"];
export type ListProvider = ListProviders[number];

export type ProviderV2 = Extract<ListProvider, { id: string }>;
export type ProvidersV2 = Array<ProviderV2>;

export type ProviderV1 = Exclude<ListProvider, ProviderV2>;
export type ProvidersV1 = Array<ProviderV1>;
