import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { UNSAFE_NavigationContext, useLocation, useNavigate } from "react-router";
import type { Account } from "@ledgerhq/types-live";
import type { AccountSettingsAdapter } from "@features/flow-account-detail-settings";
import { getAccountUrl } from "~/renderer/utils";
import { useAccountSettingsAdapter } from "LLD/hooks/useAccountSettingsAdapter";

const PORTFOLIO_PATH = "/";

function isOnAccount(pathname: string, accountId: string): boolean {
  const accountPath = getAccountUrl(accountId);
  return pathname === accountPath || pathname.startsWith(`${accountPath}/`);
}

function hasPreviousScreen(navigator: object): boolean {
  const memoryIndex = (navigator as { index?: unknown }).index;
  if (typeof memoryIndex === "number") return memoryIndex > 0;
  const browserIndex = (window.history.state as { idx?: number } | null)?.idx;
  return typeof browserIndex === "number" && browserIndex > 0;
}

export function useAccountDetailSettingsAdapter(): AccountSettingsAdapter<Account> {
  const settingsAdapter = useAccountSettingsAdapter();
  const commitAccountRemoval = settingsAdapter.removeAccount;
  const navigate = useNavigate();
  const location = useLocation();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const accountToRemoveOnUnmount = useRef<Account | undefined>(undefined);

  const leaveAccount = useCallback(() => {
    if (hasPreviousScreen(navigator)) {
      navigate(-1);
      return;
    }
    navigate(PORTFOLIO_PATH, { replace: true });
  }, [navigate, navigator]);

  useEffect(
    () => () => {
      const pending = accountToRemoveOnUnmount.current;
      if (!pending) return;
      accountToRemoveOnUnmount.current = undefined;
      commitAccountRemoval(pending);
    },
    [commitAccountRemoval],
  );

  useEffect(() => {
    const pending = accountToRemoveOnUnmount.current;
    if (!pending || !isOnAccount(location.pathname, pending.id)) return;
    leaveAccount();
  }, [leaveAccount, location]);

  const removeAccount = useCallback(
    (account: Account) => {
      accountToRemoveOnUnmount.current = account;
      leaveAccount();
    },
    [leaveAccount],
  );

  return useMemo(() => ({ ...settingsAdapter, removeAccount }), [settingsAdapter, removeAccount]);
}
