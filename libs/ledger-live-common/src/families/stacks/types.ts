// Encapsulate for LLD & LLM
export * from "@ledgerhq/coin-stacks/types/index";

import type { Account } from "@ledgerhq/types-live";
import type { StacksAccount } from "@ledgerhq/coin-stacks/types/index";

export function isStacksAccount(account: Account): account is StacksAccount {
  return account.currency.family === "stacks";
}
