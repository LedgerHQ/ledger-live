import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import type { Account } from "@ledgerhq/types-live";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { useAccountSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { useFeature } from "@features/platform-feature-flags";
import {
  resolveAccountNotices,
  type AccountNoticesProps,
} from "@features/flow-account-detail-notices";
import { useFormatDate } from "~/hooks/useDateFormatter";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { usePerpsAccountBannerViewModel } from "LLM/features/Accounts/components/PerpsAccountBanner/usePerpsAccountBannerViewModel";
import { toCurrencyStatusSignal, toCustomBannerSignal } from "./toAccountNoticeSignals";

const REGION_RESTRICTED_ERROR = "CurrencyRegionRestrictedError";

export type AccountNoticesResult = Omit<AccountNoticesProps, "testID">;

export function useAccountNotices(
  account: Account,
  currencyConfig: CurrencyConfig | undefined,
): AccountNoticesResult {
  const formatDate = useFormatDate();
  const { error } = useAccountSyncState({ accountId: account.id });
  const robinhoodDisclaimer = useFeature("llRobinhoodDisclaimer");
  const perps = useFeature("ptxPerpsLiveAppMobile");
  const { onOpenPerps } = usePerpsAccountBannerViewModel(account.currency);
  const regionRestrictedLink = useLocalizedUrl(urls.errors.AddressesSanctionedError);

  const { id: currencyId, name: currencyName, family } = account.currency;
  const isRegionRestricted = error?.name === REGION_RESTRICTED_ERROR;
  const isRobinhoodDisclaimerEnabled = Boolean(robinhoodDisclaimer?.enabled);
  const isPerpsEnabled = Boolean(perps?.enabled);

  const notices = useMemo(
    () =>
      resolveAccountNotices({
        currencyId,
        currencyName,
        family,
        supportLink: urls.contactSupportWebview.en,
        status: toCurrencyStatusSignal(currencyConfig?.status, formatDate),
        customBanner: toCustomBannerSignal(currencyConfig?.customBanner),
        isRegionRestricted,
        regionRestrictedLink,
        isRobinhoodDisclaimerEnabled,
        isPerpsEnabled,
      }),
    [
      currencyConfig,
      currencyId,
      currencyName,
      family,
      formatDate,
      isPerpsEnabled,
      isRegionRestricted,
      isRobinhoodDisclaimerEnabled,
      regionRestrictedLink,
    ],
  );

  const onOpenLink = useCallback((link: string) => {
    void Linking.openURL(link);
  }, []);

  return { notices, onOpenLink, onOpenPerps };
}
