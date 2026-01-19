import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import { Separator, TextLink } from "./common";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useTranslation } from "react-i18next";
import { useMarketCoin } from "LLD/features/Market/hooks/useMarketCoin";

export default function MarketCrumb() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currency, isLoadingCurrency } = useMarketCoin();
  const goBackToMarket = useCallback(() => {
    setTrackingSource("Page Market Coin - Breadcrumb");
    navigate("/market");
  }, [navigate]);

  return currency ? (
    <>
      <TextLink>
        <Button onClick={goBackToMarket}>{t("market.title")}</Button>
      </TextLink>
      <Separator />
      <Text>{isLoadingCurrency ? "-" : currency.name}</Text>
    </>
  ) : null;
}
