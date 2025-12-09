import { State } from ".";
import { UserId } from "@ledgerhq/identities";

/**
 * Selector to get userId from identities state
 * Always returns a UserId
 */
export const userIdSelector = (state: State): UserId => state.identities.userId;
