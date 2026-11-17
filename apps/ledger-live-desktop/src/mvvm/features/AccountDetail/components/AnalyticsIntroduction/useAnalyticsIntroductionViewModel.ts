import { useCallback } from "react";
import { useNavigate } from "react-router";
import type { AccountAnalyticsIntroductionProps } from "@features/flow-account-detail-analytics-notice";
import { dismissAccountAnalyticsIntroduction } from "@features/flow-account-detail-analytics-notice/state";
import {
  ACCOUNT_DETAIL_BUTTONS,
  ACCOUNT_DETAIL_EVENTS,
  accountButtonClickedProps,
} from "@features/flow-account-detail";
import { track } from "@shared/analytics";
import type { Account } from "@ledgerhq/types-live";
import { useDispatch } from "LLD/hooks/redux";
import type { AccountAnalyticsEntryState } from "LLD/features/Analytics/accountAnalyticsEntry";
import { getAccountUrl } from "~/renderer/utils";
import { getAccountTrackingFacts } from "../../utils/accountTracking";
import { useAnalyticsIntroductionStatus } from "./useAnalyticsIntroductionStatus";

export function useAnalyticsIntroductionViewModel(
  account: Account,
): AccountAnalyticsIntroductionProps {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useAnalyticsIntroductionStatus(account);
  const onDismiss = useCallback(() => {
    dispatch(dismissAccountAnalyticsIntroduction());
  }, [dispatch]);
  const onOpenAnalytics = useCallback(() => {
    track(
      ACCOUNT_DETAIL_EVENTS.buttonClicked,
      accountButtonClickedProps(
        getAccountTrackingFacts(account),
        ACCOUNT_DETAIL_BUTTONS.analyticsBanner,
      ),
    );
    const state: AccountAnalyticsEntryState = {
      accountAnalytics: {
        accountId: account.id,
        currencyId: account.currency.id,
        metric: "balance",
        backPath: getAccountUrl(account.id),
      },
    };
    navigate("/analytics", { state });
  }, [navigate, account]);

  return { ...status, onDismiss, onOpenAnalytics };
}
