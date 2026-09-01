import React, { createContext, useContext, type FC, type ReactNode } from "react";
import type { AccountDataScheduler } from "./scheduler";

const AccountDataContext = createContext<AccountDataScheduler | null>(null);

/**
 * Makes the scheduler an app built at its composition root available to the hooks.
 *
 * Injected rather than a module singleton: the concrete sources live in the app (this layer may not
 * import `libs/`), and a test gets its own scheduler instead of racing over a global.
 */
export const AccountDataProvider: FC<{
  /** `null` is accepted so an app can mount the provider before its boot has built the scheduler. */
  scheduler: AccountDataScheduler | null;
  children: ReactNode;
}> = ({ scheduler, children }) => (
  <AccountDataContext.Provider value={scheduler}>{children}</AccountDataContext.Provider>
);

/** The app's scheduler, or `null` when no provider is mounted — hooks then read the store only. */
export function useAccountDataScheduler(): AccountDataScheduler | null {
  return useContext(AccountDataContext);
}
