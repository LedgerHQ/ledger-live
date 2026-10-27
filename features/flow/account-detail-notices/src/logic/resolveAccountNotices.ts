import type { AccountNotice, AccountNoticeSignals, LearnMoreAction } from "../model/types";

const ROBINHOOD_CHAIN_IDS: ReadonlySet<string> = new Set(["robinhood", "robinhood_testnet"]);

const PERPS_FAMILY = "hypercore";

const learnMore = (link: string): LearnMoreAction => ({ type: "learnMore", link });

function regionRestrictedNotices({
  isRegionRestricted,
  currencyName,
  regionRestrictedLink,
}: AccountNoticeSignals): AccountNotice[] {
  if (!isRegionRestricted) return [];
  const action = regionRestrictedLink ? learnMore(regionRestrictedLink) : undefined;
  return [{ id: "regionRestricted", currencyName, action }];
}

function statusNotices({
  status,
  currencyName,
  supportLink,
}: AccountNoticeSignals): AccountNotice[] {
  if (!status) return [];
  const action = learnMore(status.link || supportLink);
  if (status.type === "migration") {
    return [{ id: "migration", from: status.from, to: status.to, action }];
  }
  return [{ id: "willBeDeprecated", currencyName, date: status.date, action }];
}

function customNotices({ customBanner }: AccountNoticeSignals): AccountNotice[] {
  if (!customBanner) return [];
  const action = customBanner.link ? learnMore(customBanner.link) : undefined;
  return [{ id: "custom", text: customBanner.text, action }];
}

function robinhoodNotices({
  currencyId,
  isRobinhoodDisclaimerEnabled,
}: AccountNoticeSignals): AccountNotice[] {
  if (!isRobinhoodDisclaimerEnabled || !ROBINHOOD_CHAIN_IDS.has(currencyId)) return [];
  return [{ id: "robinhoodDisclaimer" }];
}

function perpsNotices({ family, isPerpsEnabled }: AccountNoticeSignals): AccountNotice[] {
  if (!isPerpsEnabled || family !== PERPS_FAMILY) return [];
  return [{ id: "perps", action: { type: "openPerps" } }];
}

export function resolveAccountNotices(signals: AccountNoticeSignals): readonly AccountNotice[] {
  return [
    ...regionRestrictedNotices(signals),
    ...statusNotices(signals),
    ...customNotices(signals),
    ...robinhoodNotices(signals),
    ...perpsNotices(signals),
  ];
}
