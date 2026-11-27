import type { PrivacyPlatform } from "./types";

export const PRIVACY_URLS = {
  privacyPolicy: {
    desktop:
      "https://shop.ledger.com/pages/privacy-policy?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=privacy",
    mobile:
      "https://shop.ledger.com/pages/privacy-policy?utm_content=privacy&utm_medium=self_referral&utm_source=ledger_live_mobile",
  },
} as const satisfies Record<string, Record<PrivacyPlatform, string>>;
