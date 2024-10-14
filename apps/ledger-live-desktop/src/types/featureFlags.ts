export type EthStakingProviders = {
  listProvider: Array<{
    id: string;
    name: string;
    liveAppId: string;
    min?: number; // min required amount to stake in ETH
    disabled?: boolean;
    supportLink?: string;
    icon?: string;
    queryParams?: Record<string, string>;
  }>;
};
