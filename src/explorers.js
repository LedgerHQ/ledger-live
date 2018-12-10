// @flow

import type { Account, Operation } from "./types";

export const getAccountOperationExplorer = (
  account: Account,
  operation: Operation
): ?string =>
  account.currency.txExplorers[0] &&
  account.currency.txExplorers[0].replace("$hash", operation.hash);
