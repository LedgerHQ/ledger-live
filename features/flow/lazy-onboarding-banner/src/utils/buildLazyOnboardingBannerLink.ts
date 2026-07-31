const ATTRIBUTION = {
  utm_medium: "ledger_live",
  utm_campaign: "upsell_large_screen",
  utm_content: "lazy_onboarding_banner",
} as const;

const UTM_SOURCE_BY_PLATFORM = {
  mobile: "ledger_wallet_mobile",
  desktop: "ledger_wallet_desktop",
} as const;

const DEFAULT_LINK = "https://shop.ledger.com/";

export function buildLazyOnboardingBannerLink(
  link: string,
  platform: "mobile" | "desktop",
): string {
  const url = new URL(link.trim() || DEFAULT_LINK);

  url.searchParams.set("utm_source", UTM_SOURCE_BY_PLATFORM[platform]);
  for (const [key, value] of Object.entries(ATTRIBUTION)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
