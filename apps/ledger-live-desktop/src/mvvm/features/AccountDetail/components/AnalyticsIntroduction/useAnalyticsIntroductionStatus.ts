import { useAccountDetailAnalyticsBannerFeature } from "@features/flow-account-detail";
import {
  hasConfirmedAccountHistory,
  type AccountAnalyticsIntroductionStatus,
} from "@features/flow-account-detail-analytics-notice";
import {
  selectAccountAnalyticsIntroductionDismissed,
  selectAccountAnalyticsIntroductionEligible,
} from "@features/flow-account-detail-analytics-notice/state";
import { isConfirmedOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { confirmationsNbForCurrencySelector } from "~/renderer/reducers/settings";

export function useAnalyticsIntroductionStatus(
  account: Account,
): AccountAnalyticsIntroductionStatus {
  const isEnabled = useAccountDetailAnalyticsBannerFeature();
  const isEligible = useSelector(selectAccountAnalyticsIntroductionEligible);
  const hasDismissed = useSelector(selectAccountAnalyticsIntroductionDismissed);
  const confirmationsNb = useSelector(state =>
    confirmationsNbForCurrencySelector(state, { currency: account.currency }),
  );
  const hasConfirmedHistory = hasConfirmedAccountHistory(account, operation =>
    isConfirmedOperation(operation, account, confirmationsNb),
  );
  return { isEnabled, isEligible, hasConfirmedHistory, hasDismissed };
}
