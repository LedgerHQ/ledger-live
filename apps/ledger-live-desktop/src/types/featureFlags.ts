export type EthStakingProviders = {
  listProvider: Array<{
    name: string;
    minAccountBalance: number;
    liveAppId: string;
    supportLink: string;
  }>;
};

export type EthStakingProvidersV2 = {
  providers: Array<{
    id: string;
    name: string;
    liveAppId: string;
    supportLink: string;
    minAccountBalance: number;
    queryParams?: Record<string, string>;
  }>;
};
