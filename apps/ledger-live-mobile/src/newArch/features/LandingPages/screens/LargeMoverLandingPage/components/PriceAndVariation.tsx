import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useSelector } from "~/context/store";
import { Currency } from "@ledgerhq/types-cryptoassets";
import Delta from "~/components/Delta";
import { KeysPriceChange, MarketCoinDataChart } from "@ledgerhq/live-common/market/utils/types";
import { useTranslation } from "react-i18next";
import { useLocale } from "~/context/Locale";
import { counterValueFormatter } from "LLM/features/Market/utils";
import { getColors } from "../utils";
import { BigNumber } from "bignumber.js";

type PriceAndVariationProps = {
  price: number;
  priceChangePercentage: Record<KeysPriceChange, number>;
  range: KeysPriceChange;
  chartData?: MarketCoinDataChart;
};

export const PriceAndVariation: React.FC<PriceAndVariationProps> = ({
  price,
  priceChangePercentage,
  range,
  chartData,
}) => {
  const counterValueCurrency: Currency = useSelector(counterValueCurrencySelector);
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { textColor, bgColor } = getColors(priceChangePercentage[range]);

  const baseFromChart = chartData?.[range]?.[0]?.[1] ?? 0;
  const absoluteChangeValue = Math.abs(price - baseFromChart);
  const magnitude = counterValueCurrency.units[0].magnitude;

  const absoluteChangeMinor = BigNumber(absoluteChangeValue).multipliedBy(10 ** magnitude);

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center">
      <Text fontWeight="semiBold" fontSize="26px" color="neutral.c100" numberOfLines={1}>
        {counterValueFormatter({
          currency: counterValueCurrency.ticker,
          value: price,
          locale,
          t,
        })}
      </Text>
      <Flex flexDirection="row" alignItems="center" marginTop={3}>
        <Flex justifyContent="center" alignItems="center" marginRight="8px">
          <Delta
            unit={{ ...counterValueCurrency.units[0], code: "" }}
            valueChange={{
              value: priceChangePercentage[range],
              percentage: priceChangePercentage[range],
            }}
            isPercentSignDisplayed={true}
          />
        </Flex>
        <Flex bg={bgColor} borderRadius={6} padding={2} alignItems="center" justifyContent="center">
          <Text variant="large" color={textColor}>
            <CurrencyUnitValue unit={counterValueCurrency.units[0]} value={absoluteChangeMinor} />
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
