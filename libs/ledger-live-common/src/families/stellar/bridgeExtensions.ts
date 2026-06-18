import type { AccountBridgeExtensions } from "@ledgerhq/types-live";
import { STELLAR_DUMMY_ADDRESS } from "@ledgerhq/coin-stellar/constants";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: () => STELLAR_DUMMY_ADDRESS,
};

export default extensions;
