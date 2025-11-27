export const RECENT_ADDRESSES_COUNT_LIMIT = 12;

export type RecentAddressesCache = Record<string, string[]>;

export interface RecentAddressesStore {
  addAddress(currency: string, address: string): void;
  syncAddresses(cache: RecentAddressesCache): void;
  getAddresses(currency: string): string[];
}

type CallbackMode = "triggerCallback" | "skipCallback";

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
  private readonly onAddAddressComplete: (addressesByCurrency: Record<string, string[]>) => void;

  constructor(
    addressesByCurrency: RecentAddressesCache,
    onAddAddressComplete: (addressesByCurrency: RecentAddressesCache) => void,
  ) {
    this.addressesByCurrency = { ...addressesByCurrency };
    this.onAddAddressComplete = onAddAddressComplete;
  }

  addAddress(currency: string, address: string): void {
    this.addAddressToCache(currency, address, "triggerCallback");
  }

  syncAddresses(cache: RecentAddressesCache): void {
    const previousAddresses = { ...this.addressesByCurrency };
    this.addressesByCurrency = { ...cache };
    for (const currency in previousAddresses) {
      for (const address of previousAddresses[currency]) {
        this.addAddressToCache(currency, address, "skipCallback");
      }
    }

    this.onAddAddressComplete(this.addressesByCurrency);
  }

  getAddresses(currency: string): string[] {
    const addresses = this.addressesByCurrency[currency];
    return addresses ?? [];
  }

  private addAddressToCache(currency: string, address: string, callbackMode: CallbackMode): void {
    if (!this.addressesByCurrency[currency]) {
      this.addressesByCurrency[currency] = [];
    }

    const addresses = this.addressesByCurrency[currency];
    const addressIndex = addresses.indexOf(address);
    if (addressIndex !== -1) {
      addresses.splice(addressIndex, 1);
    } else if (addresses.length >= RECENT_ADDRESSES_COUNT_LIMIT) {
      addresses.pop();
    }

    addresses.unshift(address);
    this.addressesByCurrency[currency] = [...addresses];

    if (callbackMode === "triggerCallback") {
      this.onAddAddressComplete(this.addressesByCurrency);
    }
  }
}
