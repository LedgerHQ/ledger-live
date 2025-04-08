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
  const unit = counterValueCurrency.units[0];
  const totalPriceChange = price * (priceChangePercentage.value / 10000);

  const getColor = () => {
    if (priceChangePercentage.value > 0) return "success.c50";
    if (priceChangePercentage.value < 0) return "error.c50";
    return "neutral.c100";
  };
  return (
    <Flex flexDirection="column">
      <Text
        fontWeight="semiBold"
        fontSize="26px"
        color={"neutral.c100"}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        <CurrencyUnitValue unit={unit} value={price} />
      </Text>
      <Flex flexDirection="row" alignItems="center" marginTop={4}>
        <Text marginRight={2}>
          <Delta unit={unit} valueChange={priceChangePercentage} isLargeMover={true} />
        </Text>
        <Flex
          background={theme.colors.success.c100}
          borderRadius={6}
          padding={2}
          alignItems="center"
          justifyContent="center"
          marginBottom={2}
        >
          <Text fontSize={14} color={getColor()} fontWeight="bold">
            <CurrencyUnitValue unit={unit} value={totalPriceChange} />
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
