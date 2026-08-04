const UPSELL_UTM_MEDIUM = "ledger_live";
const UPSELL_UTM_CAMPAIGN = "nano_upgrade_program";
const UPSELL_UTM_CONTENT = "app_start_modal";

const UPSELL_UTM_SOURCE_BY_PLATFORM = {
  mobile: "ledger_wallet_mobile",
  desktop: "ledger_wallet_desktop",
} as const;

export function buildLargeScreenUpsellCtaLink(
  link: string,
  platform: "mobile" | "desktop",
): string {
  const trimmedLink = link.trim();
  if (!trimmedLink) {
    return "";
  }

  try {
    const url = new URL(trimmedLink);
    url.searchParams.set("utm_source", UPSELL_UTM_SOURCE_BY_PLATFORM[platform]);
    url.searchParams.set("utm_medium", UPSELL_UTM_MEDIUM);
    url.searchParams.set("utm_campaign", UPSELL_UTM_CAMPAIGN);
    url.searchParams.set("utm_content", UPSELL_UTM_CONTENT);
    return url.toString();
  } catch {
    return trimmedLink;
  }
}
