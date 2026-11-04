import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { useFeature } from "@features/platform-feature-flags";
import {
  resolveAccountNotices,
  toCurrencyStatusSignal,
  toCustomBannerSignal,
  type AccountNoticesProps,
} from "@features/flow-account-detail-notices";
import { urls } from "~/config/urls";
import { dayFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { usePerpsAccountBannerViewModel } from "LLD/features/Accounts/components/PerpsAccountBanner/usePerpsAccountBannerViewModel";

export type AccountNoticesViewModel = Omit<AccountNoticesProps, "testID">;

export const useAccountNoticesViewModel = (
  account: Account,
  currencyConfig: CurrencyConfig | undefined,
): AccountNoticesViewModel => {
  const formatDate = useDateFormatter(dayFormat);
  const supportLink = useLocalizedUrl(urls.contactSupportWebview);
  const robinhoodDisclaimer = useFeature("llRobinhoodDisclaimer");
  const perps = useFeature("ptxPerpsLiveApp");
  const { onOpenPerps } = usePerpsAccountBannerViewModel(account.currency);

  const { id: currencyId, name: currencyName } = account.currency;
  const isRobinhoodDisclaimerEnabled = Boolean(robinhoodDisclaimer?.enabled);
  const isPerpsEnabled = Boolean(perps?.enabled);

  const notices = useMemo(() => {
    return resolveAccountNotices({
      currencyId,
      currencyName,
      supportLink,
      status: toCurrencyStatusSignal(currencyConfig?.status, formatDate),
      customBanner: toCustomBannerSignal(currencyConfig?.customBanner),
      isRobinhoodDisclaimerEnabled,
      isPerpsEnabled,
    });
  }, [
    currencyConfig,
    currencyId,
    currencyName,
    supportLink,
    formatDate,
    isRobinhoodDisclaimerEnabled,
    isPerpsEnabled,
  ]);

  return { notices, onOpenLink: openURL, onOpenPerps };
};
