import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { ACCOUNTS_SIDEBAR_PATH } from "LLD/components/SideBar/utils";
import { getAccountUrl } from "~/renderer/utils";
import type { AccountDetailViewModel } from "../types";
import { useRouteAccount } from "./useRouteAccount";

type Redirect = Readonly<{ path: string; keepsLocationState: boolean }>;

function getRedirect(
  account: AccountLike | undefined,
  mainAccount: Account | undefined,
  accountsPath: string,
): Redirect | undefined {
  if (!account || !mainAccount) return { path: accountsPath, keepsLocationState: false };
  if (account.type !== "Account") {
    return { path: getAccountUrl(mainAccount.id), keepsLocationState: true };
  }
  return undefined;
}

export function useAccountDetailViewModel(): AccountDetailViewModel {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { account, mainAccount } = useRouteAccount();
  const redirect = getRedirect(account, mainAccount, ACCOUNTS_SIDEBAR_PATH);
  const redirectPath = redirect?.path;
  const redirectState = redirect?.keepsLocationState ? locationState : undefined;

  useEffect(() => {
    if (redirectPath) navigate(redirectPath, { replace: true, state: redirectState });
  }, [navigate, redirectPath, redirectState]);

  if (redirect || account?.type !== "Account") return { mode: "redirecting" };
  return { mode: "ready", account };
}
