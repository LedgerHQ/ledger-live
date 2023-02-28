import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/native-ui";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useSingleCoinMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import MarketPriceSection from "../WalletCentricSections/MarketPrice";

// @FIXME workarround for main tokens
const tokenIDToMarketID = {
  "ethereum/erc20/usd_tether__erc20_": "tether",
  "ethereum/erc20/usd__coin": "usd",
};

const AssetMarketSection = ({
  currency,
}: {
  currency: CryptoOrTokenCurrency;
}) => {
  const { t } = useTranslation();
  const { selectedCoinData, selectCurrency, counterCurrency } =
    useSingleCoinMarketData();

  useEffect(() => {
    selectCurrency(
      tokenIDToMarketID[currency.id as keyof typeof tokenIDToMarketID] ||
        currency.id,
      undefined,
      "24h",
    );
    return () => selectCurrency();
  }, [currency, selectCurrency]);

  if (!selectedCoinData?.price) return null;
  return (
    <SectionContainer px={6}>
      <SectionTitle
        title={t("portfolio.marketPriceSection.title", {
          currencyTicker: currency.ticker,
        })}
      />
      <Flex minHeight={65}>
        <MarketPriceSection
          currency={currency}
          selectedCoinData={selectedCoinData}
          counterCurrency={counterCurrency}
        />
      </Flex>
    </SectionContainer>
  );
};

export default React.memo(AssetMarketSection);
