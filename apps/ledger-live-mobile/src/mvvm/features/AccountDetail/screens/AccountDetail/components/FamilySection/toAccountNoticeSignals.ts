import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import type { CurrencyStatusSignal } from "@features/flow-account-detail-notices";

export function toCurrencyStatusSignal(
  status: CurrencyConfig["status"] | undefined,
  formatDate: (date: Date) => string,
): CurrencyStatusSignal | undefined {
  if (status?.type === "migration") {
    return { type: "migration", from: status.from, to: status.to, link: status.link };
  }
  if (status?.type === "will_be_deprecated") {
    return {
      type: "willBeDeprecated",
      date: formatDate(new Date(status.deprecated_date)),
      link: status.link,
    };
  }
  return undefined;
}

export function toCustomBannerSignal(
  banner: CurrencyConfig["customBanner"],
): Readonly<{ text: string; link?: string }> | undefined {
  if (!banner?.isDisplay) return undefined;
  return { text: banner.bannerText, link: banner.bannerLink };
}
