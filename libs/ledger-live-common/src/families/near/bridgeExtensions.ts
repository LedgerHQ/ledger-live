import type { AccountBridgeExtensions } from "@ledgerhq/types-live";
import { NEAR_DUMMY_ADDRESS } from "@ledgerhq/coin-near/constants";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: () => NEAR_DUMMY_ADDRESS,
};

export default extensions;
