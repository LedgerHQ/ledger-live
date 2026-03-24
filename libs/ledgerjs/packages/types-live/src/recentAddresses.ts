export type RecentAddress = {
  address: string;
  lastUsed: number;
  domainName?: string;
};

export type RecentAddressesState = Record<string, RecentAddress[]>;
