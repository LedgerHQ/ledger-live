import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";
import { useHistory } from "react-router-dom";
import { closeAllModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { isCurrencySupported } from "~/renderer/screens/exchange/config";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
const BuyButton = ({ currency, account }: { currency: CryptoCurrency; account: Account }) => {
  const history = useHistory();
  const dispatch = useDispatch();

  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRouting = useFeature("ptxSmartRouting");
  const onClick = useCallback(() => {
    dispatch(closeAllModal());
    setTrackingSource("send flow");
    history.push({
      pathname: "/exchange",
      state: ptxSmartRouting?.enabled
        ? {
            currency: currency.id,
            account: account.id,
            mode: "buy", // buy or sell
          }
        : {
            tab: 0,
            defaultCurrency: currency,
            defaultAccount: account,
          },
    });
  }, [account, currency, dispatch, history, ptxSmartRouting]);
  if (!isCurrencySupported("BUY", currency)) {
    return null;
  }
  return (
    <Button mr={1} primary inverted onClick={onClick}>
      <Trans
        i18nKey="buy.buyCTA"
        values={{
          currencyTicker: currency.ticker,
        }}
      />
    </Button>
  );
};
export default BuyButton;
