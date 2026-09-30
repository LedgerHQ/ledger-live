import type { AccountBridgeExtensions } from "@ledgerhq/types-live";
import { HEDERA_DUMMY_ADDRESS } from "@ledgerhq/coin-hedera/constants";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: () => HEDERA_DUMMY_ADDRESS,
};

export default extensions;
