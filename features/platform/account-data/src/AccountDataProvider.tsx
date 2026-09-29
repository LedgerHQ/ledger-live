import { createContext, useContext, type ReactNode } from "react";
import type { AccountDataRouter } from "./router";

const AccountDataContext = createContext<AccountDataRouter | null>(null);

export function AccountDataProvider({
  router,
  children,
}: {
  router: AccountDataRouter;
  children: ReactNode;
}) {
  return <AccountDataContext.Provider value={router}>{children}</AccountDataContext.Provider>;
}

export function useAccountDataRouter(): AccountDataRouter {
  const router = useContext(AccountDataContext);
  if (!router) throw new Error("useAccountDataRouter requires an <AccountDataProvider>");
  return router;
}
