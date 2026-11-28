import type { ScanRules } from "@domain/entity-derivation";
import {
  getKeychainObservableRange,
  showsLegacyNewAccount,
} from "@ledgerhq/ledger-wallet-framework/scanRules";

/** The scan rules the legacy `scanAccounts` reads, for a discovery to scan the same accounts. */
export function legacyScanRules(): ScanRules {
  return {
    keychainObservableRange: getKeychainObservableRange(),
    showLegacyNewAccount: showsLegacyNewAccount(),
  };
}
