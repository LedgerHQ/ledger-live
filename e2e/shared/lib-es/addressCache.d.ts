import type { Account, TokenAccount } from "./enum/Account";
export declare const ADDRESS_CACHE_FILE = "addresses.json";
export type AddressEntry = {
    index: number;
    derivationMode: string;
    address: string;
};
export type AddressCacheFile = {
    version: number;
    addresses: Record<string, AddressEntry[]>;
};
export declare function isUtxoBasedCurrency(currencyId: string): boolean;
export declare function getAddressCacheDir(): string | null;
export declare function getAddressCachePath(): string | null;
export declare function readCacheFileAt(file: string | null): AddressCacheFile | null;
export declare function matchEntry(entries: AddressEntry[], account: Account | TokenAccount): AddressEntry | undefined;
export declare function getCachedAddress(account: Account | TokenAccount): string | null;
export declare function setCachedAddressEntry(cache: AddressCacheFile, currencyId: string, entry: AddressEntry): AddressCacheFile;
//# sourceMappingURL=addressCache.d.ts.map