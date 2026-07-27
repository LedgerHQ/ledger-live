const UPSELL_UTM_SOURCE = "ledger_wallet_mobile";
const UPSELL_UTM_MEDIUM = "ledger_live";
const UPSELL_UTM_CAMPAIGN = "nano_upgrade_program";
const UPSELL_UTM_CONTENT = "app_start_modal";

export function buildLargeScreenUpsellCtaLink(link: string): string {
  const trimmedLink = link.trim();
  if (!trimmedLink) {
    return "";
  }

  try {
    const url = new URL(trimmedLink);
    url.searchParams.set("utm_source", UPSELL_UTM_SOURCE);
    url.searchParams.set("utm_medium", UPSELL_UTM_MEDIUM);
    url.searchParams.set("utm_campaign", UPSELL_UTM_CAMPAIGN);
    url.searchParams.set("utm_content", UPSELL_UTM_CONTENT);
    return url.toString();
  } catch {
    return trimmedLink;
  }
}
