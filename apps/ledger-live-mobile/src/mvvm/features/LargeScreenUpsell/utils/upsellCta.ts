export const LARGE_SCREEN_UPSELL_UTM = {
  sourceByPlatform: {
    mobile: "ledger_wallet_mobile",
    desktop: "ledger_wallet_desktop",
  },
  medium: "in_app_placements",
  campaign: "nano_upgrade_program",
  content: {
    app_start_modal: "app_start_modal",
    portfolio_banner: "portfolio_banner",
    notif_banner: "notif_banner",
    my_ledger_banner: "my_ledger_banner",
    hardware_carousel: "hardware_carousel",
    profile_cta: "profile_cta",
    backups_cta: "backups_cta",
  },
} as const;

export function buildLargeScreenUpsellCtaLink(
  link: string,
  platform: "mobile" | "desktop" = "mobile",
  utmContent: string = LARGE_SCREEN_UPSELL_UTM.content.app_start_modal,
): string {
  const trimmedLink = link.trim();
  if (!trimmedLink) {
    return "";
  }

  try {
    const url = new URL(trimmedLink);
    url.searchParams.set("utm_source", LARGE_SCREEN_UPSELL_UTM.sourceByPlatform[platform]);
    url.searchParams.set("utm_medium", LARGE_SCREEN_UPSELL_UTM.medium);
    url.searchParams.set("utm_campaign", LARGE_SCREEN_UPSELL_UTM.campaign);
    url.searchParams.set("utm_content", utmContent);
    return url.toString();
  } catch {
    return trimmedLink;
  }
}
