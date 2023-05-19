export type EthStakingProviders = {
  listProvider: Array<
    | {
        name: string;
        liveAppId: string;
        supportLink: string;
      }
    | {
        id: string;
        name: string;
        liveAppId: string;
        supportLink?: string;
        icon?: string;
        queryParams?: Record<string, string>;
      }
  >;
};
