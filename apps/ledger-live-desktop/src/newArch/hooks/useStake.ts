import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, Feature_StakePrograms, TokenAccount } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useHistory } from "react-router-dom";

// export const getCurrencyRedirectionParams = (
//   currency: CryptoCurrency | TokenCurrency,
//   flagParams: Feature_StakePrograms["params"],
// ) => {
//   const enabledCurrencies = flagParams?.list || [];
//   const redirectList = flagParams?.redirects || [];
//   const thirdPartySupportedTokens = redirectList.map(r => r?.assetId) || [];

//   return redirectList.find(r => r.assetId === currency.id) ?? null;
// };

export function useStake(currency: CryptoCurrency | TokenCurrency): {
  canDisplayStakeAction: boolean;
  canRedirectToStake: boolean;
  redirectToStake: null | ((account: Account | TokenAccount) => void);
  redirectionParams: null | { assetId: string; platformId: string; url: string };
} {
  const featureFlag = useFeature("stakePrograms");
  const history = useHistory();

  const enabledCurrencies = featureFlag?.params?.list || [];
  const redirectList = featureFlag?.params?.redirects || [];
  const thirdPartySupportedTokens = Object.keys(redirectList || []);
  const allEnabledCurrencyIds = enabledCurrencies.concat(thirdPartySupportedTokens);
  const canDisplayStakeAction = allEnabledCurrencyIds.includes(currency.id) || false;

  const redirectionParams = redirectList.find(r => r.assetId === currency.id) ?? null;

  console.log({ thirdPartySupportedTokens });

  const redirect = useCallback(
    (account: Account | TokenAccount, returnTo?: string) => {
      const value = "/platform/kiln-widget"; // TODO: will be kiln-widget

      history.push({
        pathname: value,
        state: {
          // yieldId,
          accountId: account.id,
          returnTo: returnTo ?? `/account/${account.id}`, // or earn.. pass this in as a param
        },
      });
    },
    [history],
  );

  const redirectToStake = thirdPartySupportedTokens.includes(currency.id) ? redirect : null;

  return {
    canDisplayStakeAction,
    canRedirectToStake: thirdPartySupportedTokens.includes(currency.id),
    redirectToStake,
    redirectionParams,
  };
}
