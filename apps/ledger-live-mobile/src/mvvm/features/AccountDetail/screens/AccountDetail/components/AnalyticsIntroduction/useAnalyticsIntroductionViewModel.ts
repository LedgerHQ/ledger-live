import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  ACCOUNT_DETAIL_BUTTONS,
  ACCOUNT_DETAIL_EVENTS,
  accountButtonClickedProps,
} from "@features/flow-account-detail";
import type { AccountAnalyticsIntroductionProps } from "@features/flow-account-detail-analytics-notice";
import { dismissAccountAnalyticsIntroduction } from "@features/flow-account-detail-analytics-notice/state";
import { track } from "@shared/analytics";
import type { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { useDispatch } from "~/context/hooks";
import { getAccountTrackingFacts } from "../../../../utils/accountTracking";
import { useAnalyticsIntroductionStatus } from "./useAnalyticsIntroductionStatus";

export function useAnalyticsIntroductionViewModel(
  account: Account,
): AccountAnalyticsIntroductionProps {
  const dispatch = useDispatch();
  const navigation = useNavigation<BaseNavigation>();
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
  }, [navigation, account]);

  return { ...status, onDismiss, onOpenAnalytics };
}
