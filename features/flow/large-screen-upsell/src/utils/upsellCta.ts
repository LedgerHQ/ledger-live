const UPSELL_UTM_SOURCE = "ledger_live";
const UPSELL_UTM_CAMPAIGN = "upsell_large_screen";
const UPSELL_UTM_CONTENT = "app_start_modal";

const UPSELL_UTM_MEDIUM_BY_PLATFORM = {
  mobile: "llm",
  desktop: "desktop",
} as const;

export function buildLargeScreenUpsellCtaLink(link: string, medium: "mobile" | "desktop"): string {
  const trimmedLink = link.trim();
  if (!trimmedLink) {
    return "";
  }

  try {
    const url = new URL(trimmedLink);
    url.searchParams.set("utm_source", UPSELL_UTM_SOURCE);
    url.searchParams.set("utm_medium", UPSELL_UTM_MEDIUM_BY_PLATFORM[medium]);
    url.searchParams.set("utm_campaign", UPSELL_UTM_CAMPAIGN);
    url.searchParams.set("utm_content", UPSELL_UTM_CONTENT);
    return url.toString();
  } catch {
    return trimmedLink;
  }
}
