import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useHistory } from "react-router-dom";

export function useCanShowStake(currency: CryptoCurrency | TokenCurrency): {
  showStakeAction: boolean;
  canRedirectToStake: boolean;
  redirectToStake: null | ((account: Account | TokenAccount) => void);
} {
  const featureFlag = useFeature("stakePrograms");
  const history = useHistory();

  const enabledCurrencies = featureFlag?.params?.list || [];
  const redirectList = featureFlag?.params?.redirectList || [];
  const thirdPartySupportedTokens = Object.keys(redirectList || []);

  const redirectionParams = redirectList[currency.id];

  console.log({ thirdPartySupportedTokens });

  const redirect = useCallback(
    (account: Account | TokenAccount, returnTo?: string) => {
      const value = "/platform/kiln"; // TODO: will be kiln-widget

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

  const showStakeAction =
    enabledCurrencies.concat(Object.keys(thirdPartySupportedTokens)).includes(currency.id) || false;

  return {
    showStakeAction,
    canRedirectToStake: thirdPartySupportedTokens.includes(currency.id),
    redirectToStake,
  };
}
