import { handleModularDrawerDeeplink } from "LLM/features/ModularDrawer";
import type { DeeplinkHandler } from "../types";

/**
 * Handles `ledgerlive://receive` and `ledgerlive://add-account`
 *
 * Delegates to the ModularDrawer feature handler which manages both
 * the navigation state and any required drawer dispatches.
 */
export const modularDrawerHandler: DeeplinkHandler = (
  { hostname, searchParams },
  { dispatch, config },
) => {
  return handleModularDrawerDeeplink(hostname, searchParams, dispatch, config);
};
