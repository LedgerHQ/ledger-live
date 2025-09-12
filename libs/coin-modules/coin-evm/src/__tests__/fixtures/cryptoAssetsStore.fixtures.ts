import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { setCryptoAssetsStoreGetter } from "../../cryptoAssetsStore";

/*
 * TODO change implementation when new CryptoAssesStore implemented with DADA
 */

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStoreForCoinFramework(legacyCryptoAssetsStore);

setCryptoAssetsStoreGetter(() => legacyCryptoAssetsStore);
