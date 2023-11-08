<<<<<<< HEAD
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
=======
import useFeature from "@ledgerhq/live-config/FeatureFlags/useFeature";
>>>>>>> f8e0133b13 (fix: refactoring)
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export function useCanShowStake(currency?: CryptoCurrency | TokenCurrency): boolean {
  const featureFlag = useFeature("stakePrograms");

  if (!currency || !featureFlag?.enabled) {
    return false;
  }
  return featureFlag.params?.list?.includes(currency.id) || false;
}
