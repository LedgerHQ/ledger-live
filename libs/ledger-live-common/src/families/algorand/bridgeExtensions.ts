import { ALGORAND_DUMMY_ADDRESS } from "@ledgerhq/coin-algorand/constants";
import type { AccountBridgeExtensions } from "@ledgerhq/types-live";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: () => ALGORAND_DUMMY_ADDRESS,
};

export default extensions;
