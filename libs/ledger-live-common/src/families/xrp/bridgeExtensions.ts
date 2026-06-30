import type { AccountBridgeExtensions } from "@ledgerhq/types-live";

const XRP_DUMMY_ADDRESS = "rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: () => XRP_DUMMY_ADDRESS,
};

export default extensions;
