import "../live-common-setup";
import { buildStandaloneCryptoAssetsStore } from "@features/platform-currencies/legacy";
import {
  getCryptoAssetsStore,
  setCryptoAssetsStore,
} from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { calApiConfig } from "../shared/cal-config";

/**
 * Gives the CLI a CAL token store with an empty cache, so tokens other tests were told about (or
 * told CAL doesn't know) don't leak in. Call it in `beforeEach`; it returns the undo.
 */
export function useFreshCalCache(): () => void {
  const previous = getCryptoAssetsStore();
  setCryptoAssetsStore(buildStandaloneCryptoAssetsStore(calApiConfig));
  return () => setCryptoAssetsStore(previous);
}
