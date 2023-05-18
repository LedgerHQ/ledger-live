import { EthStakingProvidersV2 } from "~/types/featureFlags";

export type Providers = EthStakingProvidersV2["providers"];
export type Provider = EthStakingProvidersV2["providers"][number];

export type Manifest =
  | {
      params?: {
        dappUrl?: string;
      };
    }
  | undefined;
