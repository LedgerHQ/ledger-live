import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { RecentAddress } from "../../../types";

/**
 * Placeholder interface for the RecentlyInteractedCache store.
 * This will be implemented with a proper store later.
 */
export interface RecentlyInteractedCache {
  storeNewAddress(currency: CryptoCurrency | TokenCurrency, address: string): void;
  getAddresses(currency: CryptoCurrency | TokenCurrency): RecentAddress[];
  removeAddress(currency: CryptoCurrency | TokenCurrency, addressToRemove: RecentAddress): void;
}

const mockRecentAddresses: RecentAddress[] = [
  {
    address: "0x95d980s5ag77xe7csuz0wyn25kmhb15e36",
    lastUsedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    currency: { id: "ethereum" } as CryptoCurrency,
  },
  {
    address: "0x95f...b15e3",
    name: "Ethereum 2",
    lastUsedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    currency: { id: "ethereum" } as CryptoCurrency,
  },
  {
    address: "0x95f...b15e3",
    name: "Vitalic.eth",
    ensName: "vitalic.eth",
    isENS: true,
    lastUsedAt: new Date("2025-01-12"),
    currency: { id: "ethereum" } as CryptoCurrency,
  },
  {
    address: "0x25f...b15e3",
    name: "0x25f...b15e3",
    ensName: "vitalic2.eth",
    isENS: true,
    lastUsedAt: new Date("2025-01-13"),
    currency: { id: "ethereum" } as CryptoCurrency,
  },
  {
    address: "0x35f...b15e3",
    name: "0x35f...b15e3",
    ensName: "vitalic3.eth",
    isENS: true,
    lastUsedAt: new Date("2025-01-07"),
    currency: { id: "ethereum" } as CryptoCurrency,
  },
  {
    address: "0x45f...b15e3",
    name: "0x45f...b15e3",
    ensName: "vitalic4.eth",
    isENS: true,
    lastUsedAt: new Date("2025-04-30"),
    currency: { id: "ethereum" } as CryptoCurrency,
  },
];

/**
 * Placeholder implementation of RecentlyInteractedCache.
 * Returns mock data for development purposes.
 */
export function createRecentlyInteractedCache(): RecentlyInteractedCache {
  let addresses = [...mockRecentAddresses];

  return {
    storeNewAddress(_currency: CryptoCurrency | TokenCurrency, _address: string): void {
      // Placeholder: Will be implemented with proper store
    },

    getAddresses(currency: CryptoCurrency | TokenCurrency): RecentAddress[] {
      return addresses.filter(addr => addr.currency.id === currency.id);
    },

    removeAddress(_currency: CryptoCurrency | TokenCurrency, addressToRemove: RecentAddress): void {
      addresses = addresses.filter(addr => {
        // Compare multiple properties to uniquely identify the address
        // Keep addresses that don't match ALL properties
        const isMatch =
          addr.address === addressToRemove.address &&
          addr.name === addressToRemove.name &&
          addr.ensName === addressToRemove.ensName &&
          addr.lastUsedAt.getTime() === addressToRemove.lastUsedAt.getTime();
        return !isMatch;
      });
    },
  };
}

export const recentlyInteractedCache = createRecentlyInteractedCache();
