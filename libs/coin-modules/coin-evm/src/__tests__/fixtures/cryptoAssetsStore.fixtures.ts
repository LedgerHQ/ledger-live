import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/tokens";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { setCryptoAssetsStoreGetter } from "../../cryptoAssetsStore";

/*
 * TODO change implementation when new CryptoAssesStore implemented with DADA
 */

setCryptoAssetsStoreForCoinFramework(legacyCryptoAssetsStore);
setCryptoAssetsStoreGetter(() => legacyCryptoAssetsStore);
