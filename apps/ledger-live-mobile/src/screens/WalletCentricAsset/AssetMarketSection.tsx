import React from "react";
import { useTranslation } from "~/context/Locale";
import { Flex } from "@ledgerhq/native-ui";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import MarketPriceSection from "../WalletCentricSections/MarketPrice";
import { useMarketCoinData } from "LLM/features/Market/hooks/useMarketCoinData";
import { resolveMarketId } from "LLM/features/Market/utils/marketIdResolver";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";

const AssetMarketSection = ({ currency }: { currency: CryptoOrTokenCurrency }) => {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const { currency: fetchedCurrency } = useMarketCoinData({
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
          counterValueUnit={counterValueCurrency.units[0]}
        />
      </Flex>
    </SectionContainer>
  );
};

export default React.memo(AssetMarketSection);
