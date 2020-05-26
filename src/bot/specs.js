// @flow
// helpers for spec
import sample from "lodash/sample";
import { isAccountEmpty } from "../account";
import type { Account } from "../types";

export function pickSiblings(
  siblings: Account[],
  maxAccount: number = 5
): Account {
  const sibling = sample(
    siblings.length > maxAccount
      ? siblings.filter((a) => !isAccountEmpty(a))
      : siblings
  );
  return sibling;
}
