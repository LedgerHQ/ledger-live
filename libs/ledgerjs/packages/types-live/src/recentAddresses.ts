export type RecentAddress = {
  address: string;
  lastUsed: number;
  ensName?: string;
};

export type RecentAddressesState = Record<string, RecentAddress[]>;
