export type EthStakingProviders = {
  listProvider: Array<{
    id: string;
    name: string;
    liveAppId: string;
    supportLink?: string;
    icon?: string;
    queryParams?: Record<string, string>;
  }>;
};
