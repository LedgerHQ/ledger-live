import { composeAccountKey, splitAccountKey } from "@ledgerhq/coin-aleo/accountKey";
import type { AccountKeyCodec } from "../../coin-modules/types";

/** The view key the legacy id keeps as custom data. */
export const aleoAccountKey: AccountKeyCodec = {
  compose: ({ freshAddress, customData }) =>
    composeAccountKey({ address: freshAddress, viewKey: customData }),
  split: key => {
    const { address, viewKey } = splitAccountKey(key);
    return viewKey ? { freshAddress: address, customData: viewKey } : { freshAddress: address };
  },
};
