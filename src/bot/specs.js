// @flow
// helpers for spec
import sample from "lodash/sample";
import { isAccountEmpty } from "../account";
import type { Account } from "../types";

export function pickSiblings(
  siblings: Account[],
  maxAccount: number = 5
): Account {
  const withoutEmpties = siblings.filter((a) => !isAccountEmpty(a));
  if (siblings.length > maxAccount) {
    // we are no longer creating accounts
    return sample(withoutEmpties);
  }

  // we are only keeping empty account that have smaller index to favorize creation of non created derivation modes
  let empties = siblings.filter(isAccountEmpty);
  empties.sort((a, b) => a.index - b.index);
  if (empties.length > 0) {
    empties = empties.filter((e) => e.index === empties[0].index);
  }

  return sample(withoutEmpties.concat(empties));
}
