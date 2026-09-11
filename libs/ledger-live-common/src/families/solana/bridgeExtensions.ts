import type { AccountBridgeExtensions } from "@ledgerhq/types-live";
import { SOLANA_DUMMY_ADDRESS } from "@ledgerhq/coin-solana/constants";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: () => SOLANA_DUMMY_ADDRESS,
};

export default extensions;
