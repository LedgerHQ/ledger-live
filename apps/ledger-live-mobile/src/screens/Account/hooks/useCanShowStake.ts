import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export function useCanShowStake(
  currency?: CryptoCurrency | TokenCurrency,
): boolean {
  const featureFlag = useFeature("stakePrograms");

  if (!currency || !featureFlag?.enabled) {
    return false;
  }
  return featureFlag.params?.list?.includes(currency.id) || false;
}
