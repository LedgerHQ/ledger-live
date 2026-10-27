import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import type { Account } from "@ledgerhq/types-live";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { useFeature } from "@features/platform-feature-flags";
import {
  resolveAccountNotices,
  type AccountNoticesProps,
} from "@features/flow-account-detail-notices";
import { useFormatDate } from "~/hooks/useDateFormatter";
import { urls } from "~/utils/urls";
import { usePerpsAccountBannerViewModel } from "LLM/features/Accounts/components/PerpsAccountBanner/usePerpsAccountBannerViewModel";
import { toCurrencyStatusSignal, toCustomBannerSignal } from "./toAccountNoticeSignals";

export type AccountNoticesResult = Omit<AccountNoticesProps, "testID">;

export const useAccountNotices = (
  account: Account,
  currencyConfig: CurrencyConfig | undefined,
): AccountNoticesResult => {
  const formatDate = useFormatDate();
  const robinhoodDisclaimer = useFeature("llRobinhoodDisclaimer");
  const perps = useFeature("ptxPerpsLiveAppMobile");
  const { onOpenPerps } = usePerpsAccountBannerViewModel(account.currency);

  const { id: currencyId, name: currencyName } = account.currency;
  const isRobinhoodDisclaimerEnabled = Boolean(robinhoodDisclaimer?.enabled);
  const isPerpsEnabled = Boolean(perps?.enabled);

  const notices = useMemo(
    () =>
      resolveAccountNotices({
        currencyId,
        currencyName,
        supportLink: urls.contactSupportWebview.en,
        status: toCurrencyStatusSignal(currencyConfig?.status, formatDate),
        customBanner: toCustomBannerSignal(currencyConfig?.customBanner),
        isRobinhoodDisclaimerEnabled,
        isPerpsEnabled,
      }),
    [
      currencyConfig,
      currencyId,
      currencyName,
      formatDate,
      isPerpsEnabled,
      isRobinhoodDisclaimerEnabled,
    ],
  );

  const onOpenLink = useCallback((link: string) => {
    void Linking.openURL(link);
  }, []);

  return { notices, onOpenLink, onOpenPerps };
};
