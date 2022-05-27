import React, { memo } from "react";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import { Unit, CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { ValueChange } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { Flex, Text } from "@ledgerhq/native-ui";

import Delta from "./Delta";
import getWindowDimensions from "../logic/getWindowDimensions";
import Graph from "../icons/Graph";
import { withDiscreetMode } from "../context/DiscreetModeContext";
import DiscreetModeButton from "./DiscreetModeButton";
import CurrencyUnitValue from "./CurrencyUnitValue";
import { counterValueCurrencySelector } from "../reducers/settings";

const { width } = getWindowDimensions();

type HeaderTitleProps = {
  valueChange: ValueChange;
  cryptoCurrencyUnit: Unit;
};

const GraphCardHeader = ({
  cryptoCurrencyUnit,
  valueChange,
}: HeaderTitleProps) => {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrencyUnit = counterValueCurrency.units[0];

  return (
    <Flex flexDirection={"row"} px={6} justifyContent={"space-between"}>
      <Flex>
        <Flex flexDirection={"row"}>
          <Text
            variant={"large"}
            fontWeight={"medium"}
            color={"neutral.c70"}
            mr={2}
          >
            <CurrencyUnitValue
              unit={cryptoCurrencyUnit}
              value={0}
              joinFragmentsSeparator=" "
            />
          </Text>
          <DiscreetModeButton size={20} />
        </Flex>
        <Text
          fontFamily="Inter"
          fontWeight="semiBold"
          fontSize="30px"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          <CurrencyUnitValue
            unit={counterCurrencyUnit}
            value={0}
            joinFragmentsSeparator=" "
          />
        </Text>
        <Flex flexDirection="row" alignItems="center">
          <Delta percent valueChange={valueChange} />
          <Flex ml={2}>
            <Delta unit={cryptoCurrencyUnit} valueChange={valueChange} />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

type Props = {
  currency: CryptoCurrency;
  valueChange: ValueChange;
};

function ReadOnlyAccountGraphCard({ currency, valueChange }: Props) {
  const { colors } = useTheme();

  return (
    <Flex
      flexDirection="column"
      bg="neutral.c30"
      mt={20}
      py={6}
      borderRadius={8}
    >
      <GraphCardHeader
        cryptoCurrencyUnit={currency.units[0]}
        valueChange={valueChange}
      />

      <Graph
        width={getWindowDimensions().width - 32}
        color={colors.neutral.c40}
      />
    </Flex>
  );
}

export default memo(withDiscreetMode(ReadOnlyAccountGraphCard));
