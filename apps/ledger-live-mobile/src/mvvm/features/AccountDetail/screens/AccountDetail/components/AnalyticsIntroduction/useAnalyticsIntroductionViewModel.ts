import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useAccountDetailAnalyticsBannerFeature } from "@features/flow-account-detail";
import {
  hasConfirmedAccountHistory,
  type AccountAnalyticsIntroductionProps,
} from "@features/flow-account-detail-analytics-notice";
import {
  dismissAccountAnalyticsIntroduction,
  selectAccountAnalyticsIntroductionDismissed,
} from "@features/flow-account-detail-analytics-notice/state";
import { isConfirmedOperation } from "@ledgerhq/live-common/operation";
import type { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { useDispatch, useSelector } from "~/context/hooks";
import { confirmationsNbForCurrencySelector } from "~/reducers/settings";

export function useAnalyticsIntroductionViewModel(
  account: Account,
): AccountAnalyticsIntroductionProps {
  const dispatch = useDispatch();
  const navigation = useNavigation<BaseNavigation>();
  const isEnabled = useAccountDetailAnalyticsBannerFeature();
  const hasDismissed = useSelector(selectAccountAnalyticsIntroductionDismissed);
  const confirmationsNb = useSelector(state =>
    confirmationsNbForCurrencySelector(state, { currency: account.currency }),
  );
  const hasConfirmedHistory = useMemo(
    () =>
      hasConfirmedAccountHistory(account, operation =>
        isConfirmedOperation(operation, account, confirmationsNb),
      ),
    [account, confirmationsNb],
  );

  const onDismiss = useCallback(() => {
    dispatch(dismissAccountAnalyticsIntroduction());
  }, [dispatch]);

  const onOpenAnalytics = useCallback(() => {
    navigation.navigate(NavigatorName.Analytics, {
      screen: ScreenName.Analytics,
      params: {
        sourceScreenName: ScreenName.AccountDetail,
        accountAnalytics: {
          accountId: account.id,
          currencyId: account.currency.id,
          metric: "balance",
        },
      },
    });
  }, [navigation, account.id, account.currency.id]);

  return { isEnabled, hasConfirmedHistory, hasDismissed, onDismiss, onOpenAnalytics };
}
