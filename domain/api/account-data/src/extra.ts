import { AccountDataRouterMissingError } from "./errors";
import {
  createAccountDataRouter,
  type AccountDataRouter,
  type AccountDataRouterOptions,
} from "./router";
import type { AccountDataSource } from "./source";

/** The router, and the reads in flight by request id, so a dispatch can wait for one it did not start. */
export type AccountDataRuntime = {
  router: AccountDataRouter;
  inflight: Map<string, Promise<void>>;
};

/** This package's slice of the thunk `extraArgument`. */
export type AccountDataExtra = { accountData: AccountDataRuntime };

/** The app's ranked sources, as a router to spread into the thunk `extraArgument`. */
export function accountDataExtra(
  sources: readonly AccountDataSource[],
  options?: AccountDataRouterOptions,
): AccountDataExtra {
  return {
    accountData: { router: createAccountDataRouter(sources, options), inflight: new Map() },
  };
}

function isAccountDataExtra(extra: unknown): extra is AccountDataExtra {
  if (typeof extra !== "object" || extra === null || !("accountData" in extra)) return false;
  const { accountData } = extra;
  return (
    typeof accountData === "object" &&
    accountData !== null &&
    "router" in accountData &&
    "inflight" in accountData &&
    accountData.inflight instanceof Map
  );
}

export function getAccountDataRuntime(extra: unknown): AccountDataRuntime {
  if (!isAccountDataExtra(extra)) throw new AccountDataRouterMissingError();
  return extra.accountData;
}

/** Adds a source to the store's router at runtime (see `AccountDataRouter.addSource`); resolves to its remover. */
export const addAccountDataSource =
  (source: AccountDataSource) =>
  (_dispatch: unknown, _getState: unknown, extra: unknown): (() => void) =>
    getAccountDataRuntime(extra).router.addSource(source);
