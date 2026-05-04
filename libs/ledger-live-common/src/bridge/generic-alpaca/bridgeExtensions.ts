import type { AccountBridge } from "@ledgerhq/types-live";
import { loadBridgeExtensionsForFamily } from "../../coin-modules/registry";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getBridgeExtensions(network: string): Partial<AccountBridge<any>> {
  return loadBridgeExtensionsForFamily(network);
}
