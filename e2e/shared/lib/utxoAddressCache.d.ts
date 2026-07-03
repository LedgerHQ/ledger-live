import type { Account, TokenAccount } from "./enum/Account";
export declare const UTXO_ADDRESS_CACHE_FILE = "utxoAddresses.json";
export declare function getUtxoAddressCachePath(): string | null;
export declare function getCachedUtxoAddress(account: Account | TokenAccount): string | null;
//# sourceMappingURL=utxoAddressCache.d.ts.map