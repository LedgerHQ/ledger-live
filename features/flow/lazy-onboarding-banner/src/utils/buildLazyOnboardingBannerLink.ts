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

function resolveSafeShopUrl(link: string): URL {
  const candidate = typeof link === "string" ? link.trim() : "";

  if (candidate) {
    try {
      const url = new URL(candidate);
      if (url.protocol === "https:") return url;
    } catch {
      // Fall through to the default Shop URL.
    }
  }

  return new URL(DEFAULT_LINK);
}

export function buildLazyOnboardingBannerLink(
  link: string,
  platform: "mobile" | "desktop",
): string {
  const url = resolveSafeShopUrl(link);

  url.searchParams.set("utm_source", UTM_SOURCE_BY_PLATFORM[platform]);
  for (const [key, value] of Object.entries(ATTRIBUTION)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
