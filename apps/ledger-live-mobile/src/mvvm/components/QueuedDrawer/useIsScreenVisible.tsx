import { selectIsAppLockBlocking } from "@features/platform-app-lock";
import { useIsFocused } from "@react-navigation/native";
import React from "react";
import { useSelector } from "~/context/hooks";

const OverAppLockContext = React.createContext(false);

export function OverAppLock({ children }: Readonly<{ children: React.ReactNode }>) {
  return <OverAppLockContext.Provider value={true}>{children}</OverAppLockContext.Provider>;
}

export function useIsScreenVisible(): boolean {
  const isFocused = useIsFocused();
  const isOverAppLock = React.useContext(OverAppLockContext);
  const isAppLockBlocking = useSelector(selectIsAppLockBlocking);

  return isOverAppLock || (isFocused && !isAppLockBlocking);
}
