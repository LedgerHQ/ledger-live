import { noop } from "lodash/fp";
import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type OnUserRefresh = () => void;

interface OnUserRefreshContextValue {
  /** Stable function reference that calls the latest registered impl */
  readonly onUserRefresh: OnUserRefresh;
  /** Stable setter to register/replace the impl (no re-render) */
  readonly setOnUserRefresh: (fn: OnUserRefresh) => void;
}

const OnUserRefreshContext = createContext<OnUserRefreshContextValue | null>(null);

/** Consumers get a stable function; safe to put in deps without causing churn */
export function useOnUserRefresh(): OnUserRefresh {
  const ctx = useContext(OnUserRefreshContext);
  if (!ctx) return () => {}; // noop outside provider (helpful for tests)
  return ctx.onUserRefresh;
}

/** Hook for effects/components to register their refresh impl */
export function useRegisterOnUserRefresh(onUserRefresh: OnUserRefresh) {
  const ctx = useContext(OnUserRefreshContext);

  useLayoutEffect(() => {
    if (ctx) {
      ctx.setOnUserRefresh(onUserRefresh);
    }
  }, [ctx, onUserRefresh]);
}

interface OnUserRefreshProviderProps {
  children: ReactNode;
}

export function OnUserRefreshProvider({ children }: OnUserRefreshProviderProps) {
  // Holds the latest implementation (mutated without triggering re-render)
  const implRef = useRef<OnUserRefresh>(noop);

  const stableOnUserRefresh: OnUserRefresh = useCallback(() => implRef.current(), []);
  const setOnUserRefresh = useCallback((fn: OnUserRefresh) => {
    implRef.current = fn;
  }, []);

  const contextValue: OnUserRefreshContextValue = useMemo(
    () => ({
      onUserRefresh: stableOnUserRefresh,
      setOnUserRefresh,
    }),
    [stableOnUserRefresh, setOnUserRefresh],
  );

  return (
    <OnUserRefreshContext.Provider value={contextValue}>{children}</OnUserRefreshContext.Provider>
  );
}
