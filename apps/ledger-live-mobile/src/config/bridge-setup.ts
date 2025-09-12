import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { getCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";

// Set up crypto assets store for coin framework
// getCryptoAssetsStore() will return the legacy store if no other store is set
setCryptoAssetsStoreForCoinFramework(getCryptoAssetsStore());
