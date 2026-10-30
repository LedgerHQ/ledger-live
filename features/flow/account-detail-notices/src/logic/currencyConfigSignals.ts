import type { AccountNoticeSignals, CurrencyStatusSignal } from "../model/types";

export type CurrencyStatusInput = Readonly<{
  type: string;
  from?: string;
  to?: string;
  link?: string;
  deprecated_date?: string;
}>;

export type CustomBannerInput = Readonly<{
  isDisplay: boolean;
  bannerText: string;
  bannerLink?: string;
}>;

export const toCurrencyStatusSignal = (
  status: CurrencyStatusInput | undefined,
  formatDate: (date: Date) => string,
): CurrencyStatusSignal | undefined => {
  if (status?.type === "migration" && status.from && status.to) {
    return { type: "migration", from: status.from, to: status.to, link: status.link };
  }
  if (status?.type === "will_be_deprecated" && status.deprecated_date) {
    return {
      type: "willBeDeprecated",
      date: formatDate(new Date(status.deprecated_date)),
      link: status.link,
    };
  }
  return undefined;
};

export const toCustomBannerSignal = (
  banner: CustomBannerInput | undefined,
): AccountNoticeSignals["customBanner"] => {
  if (!banner?.isDisplay) return undefined;
  return { text: banner.bannerText, link: banner.bannerLink };
};
