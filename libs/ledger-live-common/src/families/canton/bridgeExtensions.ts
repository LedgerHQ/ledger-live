import { isAccountEmpty } from "@ledgerhq/coin-canton";
import type { AccountBridgeExtensions } from "@ledgerhq/types-live";

const extensions: AccountBridgeExtensions = {
  isAccountEmpty,
};

export default extensions;
