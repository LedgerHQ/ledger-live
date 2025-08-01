import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { getCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";

setCryptoAssetsStoreForCoinFramework(getCryptoAssetsStore());
