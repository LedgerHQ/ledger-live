import type { AccountNotice, AccountNoticeSignals, LearnMoreAction } from "../model/types";

const learnMore = (link: string): LearnMoreAction => ({ type: "learnMore", link });

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
  isRobinhoodChain,
  isRobinhoodDisclaimerEnabled,
}: AccountNoticeSignals): AccountNotice[] {
  if (!isRobinhoodChain || !isRobinhoodDisclaimerEnabled) return [];
  return [{ id: "robinhoodDisclaimer" }];
}

function perpsNotices({ isPerpsAccount, isPerpsEnabled }: AccountNoticeSignals): AccountNotice[] {
  if (!isPerpsAccount || !isPerpsEnabled) return [];
  return [{ id: "perps", action: { type: "openPerps" } }];
}

export function resolveAccountNotices(signals: AccountNoticeSignals): readonly AccountNotice[] {
  return [
    ...statusNotices(signals),
    ...customNotices(signals),
    ...robinhoodNotices(signals),
    ...perpsNotices(signals),
  ];
}
