import type { RecentAddressesState, RecentAddress } from "@ledgerhq/types-live";

export const RECENT_ADDRESSES_COUNT_LIMIT = 12;

export type RecentAddressesCache = RecentAddressesState;

export interface RecentAddressesStore {
  addAddress(currency: string, address: string): void;
  syncAddresses(cache: RecentAddressesCache): void;
  getAddresses(currency: string): string[];
}

let recentAddressesStore: RecentAddressesStore | null = null;

export function getRecentAddressesStore(): RecentAddressesStore {
  if (recentAddressesStore === null) {
    throw new Error(
      "Recent addresses store instance is null, please call function setupRecentAddressesStore in application initialization",
    );
  }
  return recentAddressesStore;
}

export function setupRecentAddressesStore(
  addressesByCurrency: RecentAddressesCache,
  onAddAddressComplete: (addressesByCurrency: RecentAddressesCache) => void,
): void {
  recentAddressesStore = new RecentAddressesStoreImpl(addressesByCurrency, onAddAddressComplete);
}

class RecentAddressesStoreImpl implements RecentAddressesStore {
  private addressesByCurrency: RecentAddressesCache = {};
  private readonly onAddAddressComplete: (addressesByCurrency: RecentAddressesCache) => void;

  constructor(
    addressesByCurrency: RecentAddressesCache,
    onAddAddressComplete: (addressesByCurrency: RecentAddressesCache) => void,
  ) {
    this.addressesByCurrency = this.sanitizeCache(addressesByCurrency);
    this.onAddAddressComplete = onAddAddressComplete;
  }

  private sanitizeCache(cache: RecentAddressesCache): RecentAddressesCache {
    const sanitized: RecentAddressesCache = {};
    for (const currency in cache) {
      const entries = cache[currency] as (RecentAddress | string)[];
      sanitized[currency] = entries.map(entry => {
        if (typeof entry === "string") {
          return { address: entry, lastUsed: Date.now() };
        }
        return entry;
      });
    }
    return sanitized;
  }

  addAddress(currency: string, address: string): void {
    this.addAddressToCache(currency, address, Date.now(), true);
  }

  syncAddresses(cache: RecentAddressesCache): void {
    const previousAddresses = { ...this.addressesByCurrency };
    this.addressesByCurrency = { ...cache };
    for (const currency in previousAddresses) {
      const entries = previousAddresses[currency] as (RecentAddress | string)[];
      for (const entry of entries) {
        const address = typeof entry === "string" ? entry : entry.address;
        const timestamp = typeof entry === "string" ? undefined : entry.lastUsed;
        this.addAddressToCache(currency, address, timestamp ?? Date.now(), false);
      }
    }

    this.onAddAddressComplete(this.addressesByCurrency);
  }

  getAddresses(currency: string): string[] {
    const addresses = this.addressesByCurrency[currency];
    if (!addresses) return [];
    return addresses.map(entry => entry.address);
  }

  private addAddressToCache(
    currency: string,
    address: string,
    timestamp: number,
    shouldTriggerCallback: boolean,
  ): void {
    if (!this.addressesByCurrency[currency]) {
      this.addressesByCurrency[currency] = [];
    }

    const addresses = this.addressesByCurrency[currency];
    const addressIndex = addresses.findIndex(entry => entry.address === address);

    if (addressIndex !== -1) {
      addresses.splice(addressIndex, 1);
    } else if (addresses.length >= RECENT_ADDRESSES_COUNT_LIMIT) {
      addresses.pop();
    }

    addresses.unshift({ address, lastUsed: timestamp });
    this.addressesByCurrency[currency] = [...addresses];

    if (shouldTriggerCallback) {
      this.onAddAddressComplete(this.addressesByCurrency);
    }
  }
}
