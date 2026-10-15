import { AccountDataRouterMissingError } from "./errors";
import {
  createAccountDataRouter,
  type AccountDataRouter,
  type AccountDataRouterOptions,
} from "./router";
import type { AccountDataSource } from "./source";

/** This package's slice of the thunk `extraArgument`. */
export type AccountDataExtra = { accountData: AccountDataRouter };

/** The app's ranked sources, as a router to spread into the thunk `extraArgument`. */
export function accountDataExtra(
  sources: readonly AccountDataSource[],
  options?: AccountDataRouterOptions,
): AccountDataExtra {
  return { accountData: createAccountDataRouter(sources, options) };
}

function isAccountDataExtra(extra: unknown): extra is AccountDataExtra {
  if (typeof extra !== "object" || extra === null || !("accountData" in extra)) return false;
  const { accountData } = extra;
  return (
    typeof accountData === "object" &&
    accountData !== null &&
    "read" in accountData &&
    typeof accountData.read === "function"
  );
}

export function getAccountDataRouter(extra: unknown): AccountDataRouter {
  if (!isAccountDataExtra(extra)) throw new AccountDataRouterMissingError();
  return extra.accountData;
}
