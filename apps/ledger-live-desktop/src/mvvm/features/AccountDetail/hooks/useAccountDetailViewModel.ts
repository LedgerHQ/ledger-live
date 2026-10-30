import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { ACCOUNTS_SIDEBAR_PATH } from "LLD/components/SideBar/utils";
import { getAccountUrl } from "~/renderer/utils";
import type { AccountDetailViewModel } from "../types";
import { useRouteAccount } from "./useRouteAccount";

function getRedirectPath(
  account: AccountLike | undefined,
  mainAccount: Account | undefined,
  accountsPath: string,
): string | undefined {
  if (!account || !mainAccount) return accountsPath;
  if (account.type !== "Account") return getAccountUrl(mainAccount.id);
  return undefined;
}

export function useAccountDetailViewModel(): AccountDetailViewModel {
  const navigate = useNavigate();
  const { account, mainAccount } = useRouteAccount();
  const redirectPath = getRedirectPath(account, mainAccount, ACCOUNTS_SIDEBAR_PATH);

  useEffect(() => {
    if (redirectPath) navigate(redirectPath, { replace: true });
  }, [navigate, redirectPath]);

  if (redirectPath || account?.type !== "Account") return { mode: "redirecting" };
  return { mode: "ready", account };
}
