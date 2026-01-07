import React from "react";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/native-ui";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import MarketPriceSection from "../WalletCentricSections/MarketPrice";
import { useMarketCoinData } from "LLM/features/Market/hooks/useMarketCoinData";
import { resolveMarketId } from "LLM/features/Market/utils/marketIdResolver";

const AssetMarketSection = ({ currency }: { currency: CryptoOrTokenCurrency }) => {
  const { t } = useTranslation();

  const { currency: fetchedCurrency, counterCurrency } = useMarketCoinData({
    currencyId: resolveMarketId(currency.id),
  });

  if (!fetchedCurrency?.price) return null;

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
          selectedCoinData={fetchedCurrency}
          counterCurrency={counterCurrency}
        />
      </Flex>
    </SectionContainer>
  );
};

export default React.memo(AssetMarketSection);
