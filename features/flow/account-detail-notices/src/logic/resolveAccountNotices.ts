import type { AccountNotice, AccountNoticeSignals, LearnMoreAction } from "../model/types";
import { CURRENCY_NOTICES, type CurrencyNoticeId } from "./currencyNotices";

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

const CURRENCY_NOTICE_BY_ID: Readonly<Record<CurrencyNoticeId, AccountNotice>> = {
  robinhoodDisclaimer: { id: "robinhoodDisclaimer" },
  perps: { id: "perps", action: { type: "openPerps" } },
};

function currencyNotices({
  currencyId,
  isRobinhoodDisclaimerEnabled,
  isPerpsEnabled,
}: AccountNoticeSignals): AccountNotice[] {
  const isEnabled: Readonly<Record<CurrencyNoticeId, boolean>> = {
    robinhoodDisclaimer: isRobinhoodDisclaimerEnabled,
    perps: isPerpsEnabled,
  };
  return (CURRENCY_NOTICES[currencyId] ?? [])
    .filter(id => isEnabled[id])
    .map(id => CURRENCY_NOTICE_BY_ID[id]);
}

export function resolveAccountNotices(signals: AccountNoticeSignals): readonly AccountNotice[] {
  return [...statusNotices(signals), ...customNotices(signals), ...currencyNotices(signals)];
}
