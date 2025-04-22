import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useSelector } from "react-redux";
import { Currency } from "@ledgerhq/types-cryptoassets";
import Delta from "~/components/Delta";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { useTheme } from "styled-components/native";

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
  const totalPriceChange = price * (priceChangePercentage[range] / 10000);
  const { colors } = useTheme();

  const getColor = () => {
    if (priceChangePercentage[range] > 0) return "success.c70";
    if (priceChangePercentage[range] < 0) return "error.c50";
    return "neutral.c100";
  };
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center">
      <Text
        fontWeight="semiBold"
        fontSize="26px"
        color="neutral.c100"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        <CurrencyUnitValue unit={counterValueCurrency.units[0]} value={price} />
      </Text>
      <Flex flexDirection="row" alignItems="center" marginTop={3}>
        <Flex justifyContent="center" alignItems="center" marginRight={"8px"}>
          <Delta
            unit={{ ...counterValueCurrency.units[0], code: "" }}
            valueChange={{
              value: priceChangePercentage[range],
              percentage: priceChangePercentage[range],
            }}
            isPercentSignDisplayed={true}
          />
        </Flex>
        <Flex
          background={colors.success.c10}
          borderRadius={6}
          padding={2}
          alignItems="center"
          justifyContent="center"
        >
          <Text variant="large" color={getColor()}>
            <CurrencyUnitValue unit={counterValueCurrency.units[0]} value={totalPriceChange} />
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
