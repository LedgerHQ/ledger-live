import React, { memo, useCallback, useEffect } from "react";
import { Flex, Text, Icons } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { CryptoCurrency } from "@ledgerhq/live-common/types/index";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { useSingleCoinMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import { NavigatorName, ScreenName } from "../../const";
import { localeSelector } from "../../reducers/settings";
import DeltaVariation from "../Market/DeltaVariation";

type Props = {
  currency: CryptoCurrency;
};

const MarketPrice = ({ currency }: Props) => {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const navigation = useNavigation();
  const {
    selectedCoinData,
    selectCurrency,
    counterCurrency,
  } = useSingleCoinMarketData();

  useEffect(() => {
    selectCurrency(currency.id, currency, "24h");
  }, [currency]);

  const goToMarketPage = useCallback(() => {
    navigation.navigate(NavigatorName.Market, {
      screen: ScreenName.MarketDetail,
      params: {
        currencyId: currency.id,
      },
    });
  }, [navigation, currency]);

  return (
    <Flex flex={1} mt={6}>
      <TouchableOpacity onPress={goToMarketPage}>
        <Flex flex={1} flexDirection="row" alignItems="center">
          <Flex flexDirection="column" pr={7} borderRightWidth={1} borderRightColor="neutral.c30">
            <Text variant="small" fontWeight="medium" lineHeight="20px" color="neutral.c70">
              {t("portfolio.marketPriceSection.currencyPrice", { currencyTicker: currency.ticker })}
            </Text>
            <Text variant="large" fontWeight="medium">
              {counterValueFormatter({ value: selectedCoinData?.price || 0, currency: counterCurrency, locale })}
            </Text>
          </Flex>
          <Flex flex={1} flexDirection="column" pl={7}>
            <Text variant="small" fontWeight="medium" lineHeight="20px" color="neutral.c70">
              {t("portfolio.marketPriceSection.currencyPriceChange")}
            </Text>
            <DeltaVariation percent value={selectedCoinData?.priceChangePercentage || 0} />
          </Flex>
          <Icons.DroprightMedium size={24} />
        </Flex>
      </TouchableOpacity>
    </Flex>
  );
};

export default withDiscreetMode(memo<Props>(MarketPrice));
