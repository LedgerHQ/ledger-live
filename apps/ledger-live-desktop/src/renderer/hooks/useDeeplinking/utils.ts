import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, SubAccount } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { track } from "~/renderer/analytics/segment";

export const getAccountsOrSubAccountsByCurrency = (
  currency: CryptoOrTokenCurrency,
  accounts: Account[],
) => {
  const predicateFn = (account: SubAccount | Account) =>
    getAccountCurrency(account).id === currency.id;
  if (currency.type === "TokenCurrency") {
    const tokenAccounts = accounts
      .filter(acc => acc.subAccounts && acc.subAccounts.length > 0)
      .map(acc => {
        const found = acc.subAccounts?.find(predicateFn);
        return found || null;
      })
      .filter(Boolean);
    return tokenAccounts;
  }
  return accounts.filter(predicateFn);
};

type DeepLinkingEvent = {
  ajsPropSource?: string;
  ajsPropCampaign?: string;
  ajsPropTrackData?: string;
  currency?: string;
  installApp?: string;
  appName?: string;
  deeplinkSource?: string;
  deeplinkType?: string;
  deeplinkDestination?: string;
  deeplinkChannel?: string;
  deeplinkMedium?: string;
  deeplinkCampaign?: string;
  url?: string;
};

const TRACKING_EVENT = "deeplink_clicked";

export const trackDeeplinkingEvent = (event: DeepLinkingEvent) => {
  if (event.ajsPropSource) {
    const { ajsPropSource, ajsPropCampaign, url, currency, installApp, appName, ajsPropTrackData } =
      event;
    track(TRACKING_EVENT, {
      deeplinkSource: ajsPropSource,
      deeplinkCampaign: ajsPropCampaign,
      url,
      currency,
      installApp,
      appName,
      ...(ajsPropTrackData ? JSON.parse(ajsPropTrackData) : {}),
    });
  } else {
    const {
      deeplinkSource,
      deeplinkType,
      deeplinkDestination,
      deeplinkChannel,
      deeplinkMedium,
      deeplinkCampaign,
    } = event;
    track(TRACKING_EVENT, {
      deeplinkSource,
      deeplinkType,
      deeplinkDestination,
      deeplinkChannel,
      deeplinkMedium,
      deeplinkCampaign,
    });
  }
};
