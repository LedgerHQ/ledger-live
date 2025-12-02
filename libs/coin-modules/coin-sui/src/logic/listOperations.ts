import { toListOperations } from "@ledgerhq/coin-framework/api/utils";
import { getTransactions } from "./getTransactions";

// Note: temporary, for backward compatibility. This will be removed as soon as all clients have been updated to use
// getTransactions directly.
export const listOperations = toListOperations(getTransactions);
