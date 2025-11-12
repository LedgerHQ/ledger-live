/**
 * Configuration for Sui staking banners
 */
export type SuiBannerConfig = {
  showBoostBanner: boolean;
  showIncentiveBanner: boolean;
};

/**
 * Fetches the configuration for Sui staking banners
 *
 * @returns Promise that resolves to the banner configuration
 */
export async function fetchSuiBannerConfig(): Promise<SuiBannerConfig> {
  // TODO: Implement actual API call when backend endpoint is ready
  // For now, return default values
  return {
    showBoostBanner: true,
    showIncentiveBanner: true,
  };
}
