import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";
import { useNavigate } from "react-router";
import { closeAllModal } from "~/renderer/actions/modals";
import { useDispatch } from "LLD/hooks/redux";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { isCurrencySupported } from "~/renderer/screens/exchange/config";

const BuyButton = ({ currency, account }: { currency: CryptoCurrency; account: Account }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onClick = useCallback(() => {
    dispatch(closeAllModal());
    setTrackingSource("send flow");
    navigate("/exchange", {
      state: {
        currency: currency.id,
        account: account.id,
        mode: "buy", // buy or sell
      },
    });
  }, [account, currency, dispatch, navigate]);

  if (!isCurrencySupported("BUY", currency)) {
    return null;
  }

  return (
    <Button mr={1} primary onClick={onClick}>
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
