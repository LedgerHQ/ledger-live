import { useCallback } from "react";
import { useLocation } from "react-router";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { ACCOUNT_DETAIL_PAGES } from "@features/flow-account-detail";
import { setTrackingSource } from "@shared/analytics";
import { useNavigateToStakeForAccount } from "LLD/hooks/useNavigateToStakeForAccount";
import { useStake } from "LLD/hooks/useStake";

export function useTronEarnAction(account: TronAccount) {
  const { pathname } = useLocation();
  const { getCanStakeCurrency } = useStake();
  const { navigateToStakeForAccount } = useNavigateToStakeForAccount();
  const canEarn = getCanStakeCurrency(account.currency.id) && account.spendableBalance.gt(0);

  const startEarning = useCallback(() => {
    setTrackingSource(ACCOUNT_DETAIL_PAGES.account);
    navigateToStakeForAccount(account, undefined, {
      source: ACCOUNT_DETAIL_PAGES.account,
      returnTo: pathname,
    });
  }, [account, navigateToStakeForAccount, pathname]);

  return { canEarn, startEarning };
}
