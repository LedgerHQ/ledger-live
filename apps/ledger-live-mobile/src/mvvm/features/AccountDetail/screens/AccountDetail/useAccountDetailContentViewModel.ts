import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { accountTrackingProps } from "@features/flow-account-detail";
import { resolveEmptyState, type AccountEmptyStateModel } from "@features/flow-account-detail-hero";
import { shouldShowAccountAnalyticsIntroduction } from "@features/flow-account-detail-analytics-notice";
import { getAccountTrackingFacts } from "../../utils/accountTracking";
import {
  useAccountHeroPort,
  type AccountHeroPortResult,
} from "./components/Hero/useAccountHeroPort";
import { useAnalyticsIntroductionStatus } from "./components/AnalyticsIntroduction/useAnalyticsIntroductionStatus";

export type AccountDetailContentViewModel = Readonly<{
  hero: AccountHeroPortResult;
  emptyState: AccountEmptyStateModel;
  /** The page view: `source` is added by the analytics from the previous screen. */
  pageView: Readonly<{
    network: string;
    operationsCount: number;
    hasTokens: boolean;
    hasAnalyticsBanner: boolean;
  }>;
}>;

export function useAccountDetailContentViewModel(account: Account): AccountDetailContentViewModel {
  const hero = useAccountHeroPort(account);
  const { hasActivity, availability } = hero.port;
  const emptyState = useMemo(
    () => resolveEmptyState({ hasActivity, availability }),
    [hasActivity, availability],
  );
  const hasAnalyticsBanner = shouldShowAccountAnalyticsIntroduction(
    useAnalyticsIntroductionStatus(account),
  );
  const pageView = useMemo(
    () => ({
      ...accountTrackingProps(getAccountTrackingFacts(account)),
      operationsCount: account.operationsCount,
      hasTokens: (account.subAccounts?.length ?? 0) > 0,
      hasAnalyticsBanner,
    }),
    [account, hasAnalyticsBanner],
  );
  return { hero, emptyState, pageView };
}
