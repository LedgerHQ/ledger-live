import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export function useCanShowStake(currency: CryptoCurrency | TokenCurrency): { canStake: boolean } {
  const featureFlag = useFeature("stakePrograms");

  const enabledCurrencies = featureFlag?.params?.list || [];
  const thirdPartySupportedTokens = featureFlag?.params?.redirectList || [];

  const canStake =
    enabledCurrencies.concat(Object.keys(thirdPartySupportedTokens)).includes(currency.id) || false;

  return {
    canStake,
  };
}
