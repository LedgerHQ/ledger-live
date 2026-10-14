import type { AccountBridgeExtensions } from "@ledgerhq/types-live";
import { STACKS_DUMMY_ADDRESS } from "@ledgerhq/coin-stacks/constants";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: () => STACKS_DUMMY_ADDRESS,
};

export default extensions;
