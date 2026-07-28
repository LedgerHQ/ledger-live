import { AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

export type AccountCallback = (account: AccountLike, parentAccount?: AccountLike) => void;
export type CurrencyCallback = (currency: CryptoOrTokenCurrency | null) => void;

export interface RegistryManager {
  // Callback methods
  registerCallback: (id: string, callback: AccountCallback) => void;
  getCallback: (id: string) => AccountCallback | undefined;
  unregisterCallback: (id: string) => boolean;
  hasCallback: (id: string) => boolean;
  executeCallback: (id: string, account: AccountLike, parentAccount?: AccountLike) => void;
  registerCurrencyCallback: (id: string, callback: CurrencyCallback) => void;
  executeCurrencyCallback: (id: string, currency: CryptoOrTokenCurrency | null) => void;
  clearCallbacks: () => void;
  getCallbackKeys: () => string[];

  // Reset methods
  resetAll: () => void;
}
