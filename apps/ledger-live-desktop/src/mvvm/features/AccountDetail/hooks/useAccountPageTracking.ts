import { useEffect, useRef } from "react";
import type { Account } from "@ledgerhq/types-live";
import {
  ACCOUNT_DETAIL_PAGES,
  accountPageViewProps,
  accountTrackingProps,
} from "@features/flow-account-detail";
import { shouldShowAccountAnalyticsIntroduction } from "@features/flow-account-detail-analytics-notice";
import { getCurrentTrackingPage, trackPage } from "@shared/analytics";
import { getAccountTrackingFacts } from "../utils/accountTracking";
import { useAnalyticsIntroductionStatus } from "../components/AnalyticsIntroduction/useAnalyticsIntroductionStatus";

/** Sends `Page Account` once per visit of an account, not again when its operations sync. */
export function useAccountPageTracking(account: Account): void {
  const trackedAccountId = useRef<string | undefined>(undefined);
  const hasAnalyticsBanner = shouldShowAccountAnalyticsIntroduction(
    useAnalyticsIntroductionStatus(account),
  );

  useEffect(() => {
    if (trackedAccountId.current === account.id) return;
    trackedAccountId.current = account.id;

    const facts = getAccountTrackingFacts(account);
    const operationsCount = account.operationsCount;
    const hasTokens = (account.subAccounts?.length ?? 0) > 0;
    const source = getCurrentTrackingPage();

    trackPage(
      {
        category: ACCOUNT_DETAIL_PAGES.account,
        props: source
          ? accountPageViewProps({
              ...facts,
              source,
              operationsCount,
              hasTokens,
              hasAnalyticsBanner,
            })
          : { ...accountTrackingProps(facts), operationsCount, hasTokens, hasAnalyticsBanner },
      },
      { updateRoutes: true, refreshSource: true },
    );
  }, [account, hasAnalyticsBanner]);
}
