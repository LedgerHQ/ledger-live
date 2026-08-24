export const LARGE_SCREEN_UPSELL_UTM = {
  medium: "in_app_placements",
  campaign: "nano_upgrade_program",
  sourceByPlatform: {
    mobile: "ledger_wallet_mobile",
    desktop: "ledger_wallet_desktop",
  },
  content: {
    app_start_modal: "app_start_modal",
    portfolio_banner: "portfolio_banner",
    notif_banner: "notif_banner",
    my_ledger_banner: "my_ledger_banner",
    hardware_carousel: "hardware_carousel",
    profile_cta: "profile_cta",
    backups_cta: "backups_cta",
    earn_trigger: "earn_trigger",
    recover_trigger: "recover_trigger",
    l_sync_trigger: "l_sync_trigger",
    swap_trigger: "swap_trigger",
    lazy_onboarding_banner: "lazy_onboarding_banner",
  },
} as const;

export const LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT =
  LARGE_SCREEN_UPSELL_UTM.content.app_start_modal;
export const LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT = LARGE_SCREEN_UPSELL_UTM.content.backups_cta;
export const LARGE_SCREEN_UPSELL_UTM_MEDIUM = LARGE_SCREEN_UPSELL_UTM.medium;
export const LARGE_SCREEN_UPSELL_UTM_CAMPAIGN = LARGE_SCREEN_UPSELL_UTM.campaign;
export const LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM = LARGE_SCREEN_UPSELL_UTM.sourceByPlatform;

export type LargeScreenUpsellUtmContent =
  (typeof LARGE_SCREEN_UPSELL_UTM.content)[keyof typeof LARGE_SCREEN_UPSELL_UTM.content];

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
    url.searchParams.set("utm_source", LARGE_SCREEN_UPSELL_UTM.sourceByPlatform[platform]);
    url.searchParams.set("utm_medium", LARGE_SCREEN_UPSELL_UTM.medium);
    url.searchParams.set("utm_campaign", LARGE_SCREEN_UPSELL_UTM.campaign);
    url.searchParams.set("utm_content", utmContent);
    return url.toString();
  } catch {
    return trimmedLink;
  }
}
