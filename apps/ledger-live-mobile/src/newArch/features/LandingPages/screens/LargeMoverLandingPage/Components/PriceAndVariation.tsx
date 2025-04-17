import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useSelector } from "react-redux";
import { Currency } from "@ledgerhq/types-cryptoassets";
import Delta from "~/components/Delta";
import { ValueChange } from "@ledgerhq/types-live";
import theme from "@ledgerhq/native-ui/styles/theme";

type PriceAndVariationProps = {
  price: number;
  priceChangePercentage: ValueChange;
};

export const PriceAndVariation: React.FC<PriceAndVariationProps> = ({
  price,
  priceChangePercentage,
}) => {
  const counterValueCurrency: Currency = useSelector(counterValueCurrencySelector);
  const totalPriceChange = price * (priceChangePercentage.value / 10000);

  const getColor = () => {
    if (priceChangePercentage.value > 0) return "success.c70";
    if (priceChangePercentage.value < 0) return "error.c50";
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
            valueChange={priceChangePercentage}
            isPercentSignDisplayed={true}
          />
        </Flex>
        <Flex
          background={theme.colors.success.c100}
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
