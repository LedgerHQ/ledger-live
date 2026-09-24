import type { AccountBridgeExtensions } from "@ledgerhq/types-live";
import { CASPER_DUMMY_ADDRESS } from "@ledgerhq/coin-casper/constants";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: () => CASPER_DUMMY_ADDRESS,
};

export default extensions;
