import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { setCryptoAssetsStoreGetter } from "../../cryptoAssetsStore";

/*
 * TODO change implementation when new CryptoAssesStore implemented with DADA
 */

initializeLegacyTokens(addTokens);
setCryptoAssetsStoreForCoinFramework(legacyCryptoAssetsStore);
setCryptoAssetsStoreGetter(() => legacyCryptoAssetsStore);
