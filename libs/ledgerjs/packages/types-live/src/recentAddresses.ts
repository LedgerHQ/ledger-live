export type RecentAddress = {
  address: string;
  lastUsed: number;
};

export type RecentAddressesState = Record<string, RecentAddress[]>;
