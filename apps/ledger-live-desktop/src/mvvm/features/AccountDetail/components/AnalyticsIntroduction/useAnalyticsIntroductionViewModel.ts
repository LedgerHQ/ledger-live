import { useCallback } from "react";
import { useNavigate } from "react-router";
import { hasConfirmedAccountHistory } from "@features/flow-account-detail-analytics-notice";
import type { AccountAnalyticsIntroductionProps } from "@features/flow-account-detail-analytics-notice/web";
import {
  dismissAccountAnalyticsIntroduction,
  selectAccountAnalyticsIntroductionDismissed,
} from "@features/flow-account-detail-analytics-notice/state";
import { isConfirmedOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import type { AccountAnalyticsEntryState } from "LLD/features/Analytics/accountAnalyticsEntry";
import { confirmationsNbForCurrencySelector } from "~/renderer/reducers/settings";
import { getAccountUrl } from "~/renderer/utils";

export function useAnalyticsIntroductionViewModel(
  account: Account,
): AccountAnalyticsIntroductionProps {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasDismissed = useSelector(selectAccountAnalyticsIntroductionDismissed);
  const confirmationsNb = useSelector(state =>
    confirmationsNbForCurrencySelector(state, { currency: account.currency }),
  );
  const hasConfirmedHistory = hasConfirmedAccountHistory(account, operation =>
    isConfirmedOperation(operation, account, confirmationsNb),
  );
  const onDismiss = useCallback(() => {
    dispatch(dismissAccountAnalyticsIntroduction());
  }, [dispatch]);
  const onOpenAnalytics = useCallback(() => {
    const state: AccountAnalyticsEntryState = {
      accountAnalytics: {
        accountId: account.id,
        currencyId: account.currency.id,
        metric: "balance",
        backPath: getAccountUrl(account.id),
      },
    };
    navigate("/analytics", { state });
  }, [navigate, account.id, account.currency.id]);

  return { hasConfirmedHistory, hasDismissed, onDismiss, onOpenAnalytics };
}
