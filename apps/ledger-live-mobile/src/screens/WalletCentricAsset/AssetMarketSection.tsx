import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/native-ui";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import MarketPriceSection from "../WalletCentricSections/MarketPrice";
import { useMarketCoinData } from "~/newArch/features/Market/hooks/useMarketCoinData";

// @FIXME workaround for main tokens
const tokenIDToMarketID = {
  "ethereum/erc20/usd_tether__erc20_": "tether",
  "ethereum/erc20/usd__coin": "usd-coin",
};

const AssetMarketSection = ({ currency }: { currency: CryptoOrTokenCurrency }) => {
  const { t } = useTranslation();
  const [selectedCurrency, setSelectedCurrency] = useState<{ id: string; name: string }>({
    ...currency,
  });
  const { currency: fetchedCurrency, counterCurrency } = useMarketCoinData({
    currencyId: selectedCurrency.id,
    currencyName: selectedCurrency.name,
  });

  useEffect(() => {
    setSelectedCurrency({
      id: tokenIDToMarketID[currency.id as keyof typeof tokenIDToMarketID] || currency.id,
      name: currency.name,
    });
  }, [currency]);

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
