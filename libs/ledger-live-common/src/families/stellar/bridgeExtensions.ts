import type { AccountBridgeExtensions } from "@ledgerhq/types-live";
import { STELLAR_DUMMY_ADDRESS } from "./constants";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: () => STELLAR_DUMMY_ADDRESS,
};

export default extensions;
