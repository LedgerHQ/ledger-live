export const LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT = "app_start_modal";
export const LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT = "backups_cta";

export type LargeScreenUpsellUtmContent =
  | typeof LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT
  | typeof LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT;

export const LARGE_SCREEN_UPSELL_UTM_MEDIUM = "ledger_live";
export const LARGE_SCREEN_UPSELL_UTM_CAMPAIGN = "nano_upgrade_program";

export const LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM = {
  mobile: "ledger_wallet_mobile",
  desktop: "ledger_wallet_desktop",
} as const;

export function buildLargeScreenUpsellCtaLink(
  link: string,
  platform: "mobile" | "desktop",
  utmContent: LargeScreenUpsellUtmContent,
): string {
  const trimmedLink = link.trim();
  if (!trimmedLink) {
    return "";
  }

  try {
    const url = new URL(trimmedLink);
    url.searchParams.set("utm_source", LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM[platform]);
    url.searchParams.set("utm_medium", LARGE_SCREEN_UPSELL_UTM_MEDIUM);
    url.searchParams.set("utm_campaign", LARGE_SCREEN_UPSELL_UTM_CAMPAIGN);
    url.searchParams.set("utm_content", utmContent);
    return url.toString();
  } catch {
    return trimmedLink;
  }
}
