import React, { memo } from "react";
import { useTheme } from "styled-components/native";
import { Unit, CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { ValueChange } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { Flex, Text } from "@ledgerhq/native-ui";

import Delta from "./Delta";
import getWindowDimensions from "../logic/getWindowDimensions";
import Graph from "../icons/Graph";

const { width } = getWindowDimensions();

type HeaderTitleProps = {
  valueChange: ValueChange;
  cryptoCurrencyUnit: Unit;
};

const GraphCardHeader = ({
  cryptoCurrencyUnit,
  valueChange,
}: HeaderTitleProps) => {
  return (
    <Flex flexDirection={"row"} px={6} justifyContent={"space-between"}>
      <Flex>
        <Flex flexDirection={"row"}>
          <Text variant={"large"} fontWeight={"medium"} color={"neutral.c70"}>
            {`0 ${cryptoCurrencyUnit.code}`}
          </Text>
        </Flex>
        <Text
          fontFamily="Inter"
          fontWeight="semiBold"
          fontSize="30px"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          $0.00
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

export default memo(ReadOnlyAccountGraphCard);
