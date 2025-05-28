import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useSelector } from "react-redux";
import { Currency } from "@ledgerhq/types-cryptoassets";
import Delta from "~/components/Delta";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { useTranslation } from "react-i18next";
import { useLocale } from "~/context/Locale";
import { counterValueFormatter } from "~/newArch/features/Market/utils";
import { getColors } from "../utils";

type PriceAndVariationProps = {
  price: number;
  priceChangePercentage: Record<KeysPriceChange, number>;
  range: KeysPriceChange;
};

export const PriceAndVariation: React.FC<PriceAndVariationProps> = ({
  price,
  priceChangePercentage,
  range,
}) => {
  const counterValueCurrency: Currency = useSelector(counterValueCurrencySelector);
  const totalPriceChange = price * priceChangePercentage[range];
  const { t } = useTranslation();
  const { locale } = useLocale();

  const { textColor, bgColor } = getColors(priceChangePercentage[range]);

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center">
      <Text
        fontWeight="semiBold"
        fontSize="26px"
        color="neutral.c100"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {counterValueFormatter({
          currency: counterValueCurrency.ticker,
          value: price || 0,
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
            <CurrencyUnitValue unit={counterValueCurrency.units[0]} value={totalPriceChange} />
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
