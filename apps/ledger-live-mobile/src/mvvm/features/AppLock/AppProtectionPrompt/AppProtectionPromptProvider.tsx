import { selectIsAppLockConfigured } from "@features/platform-app-lock";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useStore } from "~/context/hooks";
import { useAppLockScheme } from "../hooks/useAppLockScheme";
import type { AppProtectionPrompt, AppProtectionPromptState, AppProtectionRequest } from "./types";

const AppProtectionPromptContext = createContext<AppProtectionPromptState | null>(null);

export function AppProtectionPromptProvider({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const store = useStore();
  const scheme = useAppLockScheme();
  const [request, setRequest] = useState<AppProtectionRequest | null>(null);
  const resolveRef = useRef<((isProtectionGranted: boolean) => void) | null>(null);

  const settle = useCallback((isProtectionGranted: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setRequest(null);
    resolve?.(isProtectionGranted);
  }, []);

  // A caller awaits this promise: if the tree holding it goes, the await must end rather than
  // hang on a request nothing can answer any more.
  useEffect(
    () => () => {
      resolveRef.current?.(false);
      resolveRef.current = null;
    },
    [],
  );

  const requestProtection = useCallback(
    (next: AppProtectionRequest = {}) => {
      if (selectIsAppLockConfigured(store.getState())) {
        return Promise.resolve(true);
      }

      // Nothing to enforce while the revamp is off: the legacy screens store a password this
      // scheme cannot read, so the prompt could not honestly report protection, and holding the
      // caller would break a feature that works today. Callers ask "may I continue", not "is it
      // protected" — `selectIsAppLockConfigured` answers that one.
      if (scheme !== "revamped") {
        return Promise.resolve(true);
      }

      settle(false);
      setRequest(next);

      return new Promise<boolean>(resolve => {
        resolveRef.current = resolve;
      });
    },
    [scheme, settle, store],
  );

  const value = useMemo(
    () => ({ requestProtection, request, settle }),
    [request, requestProtection, settle],
  );

  return (
    <AppProtectionPromptContext.Provider value={value}>
      {children}
    </AppProtectionPromptContext.Provider>
  );
}

// Callers ask whether they may continue, and a host that installs no prompt has no app lock to
// enforce, so there is nothing to ask and they carry on — the same answer the revamped scheme's
// absence gives. A missing provider where one is expected is caught by the wrapper below, which
// the app mounts unconditionally, rather than by every call site.
const NOTHING_TO_ASK: AppProtectionPrompt = { requestProtection: () => Promise.resolve(true) };

export function useAppProtectionPrompt(): AppProtectionPrompt {
  const context = useContext(AppProtectionPromptContext);
  const requestProtection = context?.requestProtection;

  return useMemo(
    () => (requestProtection ? { requestProtection } : NOTHING_TO_ASK),
    [requestProtection],
  );
}

export function useAppProtectionPromptState(): AppProtectionPromptState {
  const context = useContext(AppProtectionPromptContext);

  if (!context) {
    throw new Error(
      "useAppProtectionPromptState must be used within an AppProtectionPromptProvider",
    );
  }

  return context;
}
