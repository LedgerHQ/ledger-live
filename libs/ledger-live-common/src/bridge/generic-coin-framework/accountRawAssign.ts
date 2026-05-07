import type { AccountBridge } from "@ledgerhq/types-live";
import evmAccountRawAssign from "./families/evm/accountRawAssign";
import type { GenericTransaction } from "./types";

type AccountRawAssignHooks = {
  assignFromAccountRaw?: AccountBridge<GenericTransaction>["assignFromAccountRaw"];
  assignToAccountRaw?: AccountBridge<GenericTransaction>["assignToAccountRaw"];
};

/**
 * Dispatch per-family hooks that persist family-specific account resources
 * through the `fromAccountRaw` / `toAccountRaw` cycle.
 *
 * The default Alpaca pipeline only knows about generic account fields; each
 * family can expose a local adapter here when it needs extra raw assignment.
 */
export function getAccountRawAssignHooks(network: string): AccountRawAssignHooks {
  switch (network) {
    case "evm":
      return evmAccountRawAssign;
    default:
      return {};
  }
}
