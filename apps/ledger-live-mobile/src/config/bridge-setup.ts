import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { getCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";
import { createCryptoAssetsHooks } from "@ledgerhq/cryptoassets/hooks";

export const cryptoAssetsHooks = createCryptoAssetsHooks({});

setCryptoAssetsStoreForCoinFramework(getCryptoAssetsStore());
