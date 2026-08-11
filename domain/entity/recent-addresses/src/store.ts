import type { Dispatch, Unsubscribe } from "@reduxjs/toolkit";
import {
  RecentAddressesArraySchema,
  type RecentAddress,
  type RecentAddressesState,
} from "./schema";
import { updateRecentAddresses } from "./slice";

export const RECENT_ADDRESSES_COUNT_LIMIT = 12;

export interface RecentAddressesStore {
  addAddress(currency: string, address: string, ensName?: string): void;
  removeAddress(currency: string, address: string): void;
  syncAddresses(cache: RecentAddressesState): void;
  getAddresses(currency: string): RecentAddress[];
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
  addressesByCurrency: RecentAddressesState,
  onAddAddressComplete: (addressesByCurrency: RecentAddressesState) => void,
): void {
  recentAddressesStore = new RecentAddressesStoreImpl(addressesByCurrency, onAddAddressComplete);
}

class RecentAddressesStoreImpl implements RecentAddressesStore {
  private addressesByCurrency: RecentAddressesState = {};
  private readonly onAddAddressComplete: (addressesByCurrency: RecentAddressesState) => void;

  constructor(
    addressesByCurrency: RecentAddressesState,
    onAddAddressComplete: (addressesByCurrency: RecentAddressesState) => void,
  ) {
    this.addressesByCurrency = this.sanitizeCache(addressesByCurrency);
    this.onAddAddressComplete = onAddAddressComplete;
  }

  private sanitizeCache(cache: RecentAddressesState): RecentAddressesState {
    const sanitized: RecentAddressesState = {};
    for (const currency in cache) {
      const entries = cache[currency];
      const result = RecentAddressesArraySchema.safeParse(entries);
      sanitized[currency] = result.success ? result.data : [];
    }
    return sanitized;
  }

  addAddress(currency: string, address: string, ensName?: string): void {
    this.addAddressToCache(currency, address, Date.now(), true, ensName);
  }

  removeAddress(currency: string, address: string): void {
    const current = this.addressesByCurrency[currency];
    if (!current) return;
    const addresses = [...current];
    const index = addresses.findIndex(entry => entry.address === address);
    if (index !== -1) {
      addresses.splice(index, 1);
      this.addressesByCurrency = { ...this.addressesByCurrency, [currency]: addresses };
      this.onAddAddressComplete(this.addressesByCurrency);
    }
  }

  syncAddresses(cache: RecentAddressesState): void {
    const previousAddresses = { ...this.addressesByCurrency };
    this.addressesByCurrency = this.sanitizeCache(cache);
    for (const currency in previousAddresses) {
      const entries = previousAddresses[currency];
      for (const entry of entries) {
        this.addAddressToCache(currency, entry.address, entry.lastUsed, false, entry.ensName);
      }
    }

    this.onAddAddressComplete(this.addressesByCurrency);
  }

  getAddresses(currency: string): RecentAddress[] {
    const addresses = this.addressesByCurrency[currency];
    if (!addresses) return [];
    return addresses.filter(
      (entry): entry is RecentAddress =>
        !!entry && typeof entry.address === "string" && entry.address.length > 0,
    );
  }

  private addAddressToCache(
    currency: string,
    address: string,
    timestamp: number,
    shouldTriggerCallback: boolean,
    ensName?: string,
  ): void {
    const addresses = [...(this.addressesByCurrency[currency] ?? [])];
    const addressIndex = addresses.findIndex(entry => entry.address === address);

    if (addressIndex !== -1) {
      addresses.splice(addressIndex, 1);
    } else if (addresses.length >= RECENT_ADDRESSES_COUNT_LIMIT) {
      addresses.pop();
    }

    addresses.unshift({ address, lastUsed: timestamp, ensName });
    this.addressesByCurrency = { ...this.addressesByCurrency, [currency]: addresses };

    if (shouldTriggerCallback) {
      this.onAddAddressComplete(this.addressesByCurrency);
    }
  }
}

export type RecentAddressesReduxStore<S> = {
  getState: () => S;
  dispatch: Dispatch;
  subscribe: (listener: () => void) => Unsubscribe;
};

/**
 * Wires the in-memory store to a Redux store: seeds it from the persisted slice and mirrors
 * every mutation back through `updateRecentAddresses`.
 */
export function connectRecentAddressesStore<S>(
  store: RecentAddressesReduxStore<S>,
  selectRecentAddresses: (state: S) => RecentAddressesState,
): void {
  setupRecentAddressesStore(selectRecentAddresses(store.getState()), addressesByCurrency => {
    store.dispatch(updateRecentAddresses(addressesByCurrency));
  });

  // The persisted slice may still be rehydrating, so pick up the first non-empty state.
  const unsubscribe: Unsubscribe = store.subscribe(() => {
    const cache = selectRecentAddresses(store.getState());
    if (Object.keys(cache).length > 0) {
      unsubscribe();
      getRecentAddressesStore().syncAddresses(cache);
    }
  });
}
