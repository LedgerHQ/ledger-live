import React, { memo, useCallback } from "react";
import { Flex, Text, IconsLegacy } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { ScreenName } from "~/const";
import DeltaVariation from "LLM/features/Market/components/DeltaVariation";
import Touchable from "~/components/Touchable";
import { useSettings } from "~/hooks";
import { CurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { useTimeRange } from "~/actions/settings";
import { PortfolioRange } from "@ledgerhq/types-live";

type Props = {
  currency: CryptoOrTokenCurrency;
  selectedCoinData: CurrencyData;
  counterCurrency: string | undefined;
};

const MarketPrice = ({ currency, selectedCoinData, counterCurrency }: Props) => {
  const { t } = useTranslation();
  const { locale } = useSettings();
  const navigation = useNavigation();

  const [range] = useTimeRange();

  const goToMarketPage = useCallback(() => {
    navigation.navigate(ScreenName.MarketDetail, {
      currencyId: currency.id,
      currencyName: currency.name,
    });
  }, [currency, navigation]);

  const getPrice = (selectedCoinData: CurrencyData, range: PortfolioRange) => {
    switch (range) {
      case "all":
      case "year":
        return selectedCoinData.priceChangePercentage["1y"];
      case "month":
        return selectedCoinData.priceChangePercentage["30d"];
      case "week":
        return selectedCoinData.priceChangePercentage["7d"];
      default:
      case "day":
        return selectedCoinData.priceChangePercentage["24h"];
    }
  };

  const priceChange = getPrice(selectedCoinData, range);
  return (
    <Flex flex={1} mt={6}>
      <Touchable
        event="market_data_clicked"
        eventProperties={{ currency: currency.name }}
        onPress={goToMarketPage}
      >
        <Flex flex={1} flexDirection="row" alignItems="center">
          <Flex flexDirection="column" pr={7} borderRightWidth={1} borderRightColor="neutral.c30">
            <Text variant="small" fontWeight="medium" lineHeight="20px" color="neutral.c70">
              {t("portfolio.marketPriceSection.currencyPrice", {
                currencyTicker: currency.ticker,
              })}
            </Text>
            <Text variant="large" fontWeight="medium">
              {counterValueFormatter({
                value: selectedCoinData?.price || 0,
                currency: counterCurrency,
                locale,
              })}
            </Text>
          </Flex>
          <Flex flex={1} flexDirection="column" pl={7} alignItems={"flex-start"}>
            <Text variant="small" fontWeight="medium" lineHeight="20px" color="neutral.c70">
              {t("portfolio.marketPriceSection.currencyPriceChange")}
            </Text>
            <DeltaVariation percent value={priceChange || 0} />
          </Flex>
          <IconsLegacy.ChevronRightMedium size={24} />
        </Flex>
      </Touchable>
    </Flex>
  );
};

export default withDiscreetMode(memo<Props>(MarketPrice));
