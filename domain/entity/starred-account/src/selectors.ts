import { parseAnyAccountId } from "@shared/schema-primitives";
import type { StarredAccountState } from "./slice";

export const isStarredAccountSelector = (
  state: StarredAccountState,
  { accountId }: { accountId: string },
): boolean => state.has(parseAnyAccountId(accountId));
