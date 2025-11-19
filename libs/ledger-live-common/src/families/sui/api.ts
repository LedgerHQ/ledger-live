/**
 * Configuration for Sui staking banners
 */
export type SuiBannerConfig = {
  showBoostBanner: boolean;
  showIncentiveBanner: boolean;
};

type Promotion = {
  promotionId: string;
  currencyFrom: string | null;
  currencyTo: string;
  endDate: string;
  registerable?: boolean;
};

const PROMOTIONAL_API_BASE = "https://promotional-campaign.ledger-test.com/api/v1";
const SUI_PROMOTION_ID = "earn-sui-reward-dec2025";

/**
 * Fetches the configuration for Sui staking banners
 *
 * @param address - The Sui address to check registration status for
 * @returns Promise that resolves to the banner configuration
 *
 * Logic:
 * 1. Call /promotions to check if earn-sui-reward-dec2025 is live
 * 2. If not live OR not registerable (2000 participants reached): show nothing
 * 3. If live and if address is a valid SUI address, call /promotions/earn-sui-reward-dec2025?address=X
 * 4. If address is registered (staked amount > 30 SUI): show banner 2 ("stake eligible")
 * 5. If address not registered and promo still registerable (participants < 2000): show banner 1
 */
export async function fetchSuiBannerConfig(address?: string): Promise<SuiBannerConfig> {
  try {
    // Step 1: Check if promotion is live
    const promotionsResponse = await fetch(`${PROMOTIONAL_API_BASE}/promotions`);
    if (!promotionsResponse.ok) {
      return { showBoostBanner: false, showIncentiveBanner: false };
    }

    const promotions: Promotion[] = await promotionsResponse.json();
    const suiPromotion = promotions.find(p => p.promotionId === SUI_PROMOTION_ID);

    // Step 2: If promotion not live or not registerable, show nothing
    if (!suiPromotion || suiPromotion.registerable === false) {
      return { showBoostBanner: false, showIncentiveBanner: false };
    }

    // Step 3: If no address provided or invalid SUI address, show boost banner (user can still register)
    if (!address || !isValidSuiAddress(address)) {
      return { showBoostBanner: true, showIncentiveBanner: false };
    }

    // Step 4: Check if address is registered
    const registrationResponse = await fetch(
      `${PROMOTIONAL_API_BASE}/promotions/${SUI_PROMOTION_ID}?address=${address}`,
    );

    // Step 5: If registered (200), show incentive banner. If not (404), show boost banner
    if (registrationResponse.ok) {
      return { showBoostBanner: false, showIncentiveBanner: true };
    } else if (registrationResponse.status === 404) {
      return { showBoostBanner: true, showIncentiveBanner: false };
    }

    // Fallback for unexpected status codes
    return { showBoostBanner: false, showIncentiveBanner: false };
  } catch (error) {
    // Fail-safe: don't show banners on error
    console.error("Failed to fetch Sui banner config:", error);
    return { showBoostBanner: false, showIncentiveBanner: false };
  }
}

/**
 * Validates if a string is a valid SUI address
 * SUI addresses are 32-byte hex strings prefixed with 0x (66 characters total)
 */
function isValidSuiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

/**
 * Registers an address for the Sui staking promotion
 * Should be called after a successful stake transaction with >= 30 SUI on P2P validator
 *
 * @param address - The Sui address to register
 * @returns Promise that resolves when registration is complete
 */
export async function registerSuiStakingPromotion(address: string): Promise<void> {
  try {
    if (!isValidSuiAddress(address)) {
      console.warn("Invalid SUI address provided for registration:", address);
      return;
    }

    const response = await fetch(`${PROMOTIONAL_API_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        promotionId: SUI_PROMOTION_ID,
        address,
      }),
    });

    if (!response.ok) {
      console.warn("Failed to register for Sui staking promotion:", response.status);
    }
  } catch (error) {
    // Fail silently - registration failure shouldn't block the user
    console.error("Error registering for Sui staking promotion:", error);
  }
}
