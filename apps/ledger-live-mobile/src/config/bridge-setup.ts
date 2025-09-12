import "@ledgerhq/cryptoassets/tokens"; // EFFECTIVELY LOAD THE TOKENS INTO legacy-store !

import { setup } from "@ledgerhq/live-common/bridge/impl";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";

setup(legacyCryptoAssetsStore);
