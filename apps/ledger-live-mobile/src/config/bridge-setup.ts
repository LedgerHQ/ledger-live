import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { getCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";
import { createCryptoAssetsHooks } from "@ledgerhq/cryptoassets/hooks";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { setup } from "@ledgerhq/live-common/bridge/impl";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import { StoreType } from "../context/store";

initializeLegacyTokens(addTokens);

export const cryptoAssetsHooks = createCryptoAssetsHooks({});

export function setupCryptoAssetsStore(_store: StoreType) {
  setCryptoAssetsStoreForCoinFramework(getCryptoAssetsStore());
  setup(legacyCryptoAssetsStore);
}
