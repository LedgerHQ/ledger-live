const UPSSELL_UTM_SOURCE = "ledger_live";
const UPSSELL_UTM_MEDIUM = "llm";
const UPSSELL_UTM_CAMPAIGN = "upsell_large_screen";
const UPSSELL_UTM_CONTENT = "app_start_modal";

export function buildLargeScreenUpsellCtaLink(link: string): string {
  const trimmedLink = link.trim();
  if (!trimmedLink) {
    return "";
  }

  try {
    const url = new URL(trimmedLink);
    url.searchParams.set("utm_source", UPSSELL_UTM_SOURCE);
    url.searchParams.set("utm_medium", UPSSELL_UTM_MEDIUM);
    url.searchParams.set("utm_campaign", UPSSELL_UTM_CAMPAIGN);
    url.searchParams.set("utm_content", UPSSELL_UTM_CONTENT);
    return url.toString();
  } catch {
    return trimmedLink;
  }
}
