import React, { memo } from "react";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { Flex, Text } from "@ledgerhq/native-ui";

import { withDiscreetMode } from "~/context/DiscreetModeContext";
import DiscreetModeButton from "./DiscreetModeButton";
import CurrencyUnitValue from "./CurrencyUnitValue";

type Props = {
  counterValueCurrency: Currency;
  headerText: JSX.Element | string;
};

function ReadOnlyGraphCard({ counterValueCurrency, headerText }: Props) {
  const counterValueUnit = counterValueCurrency.units[0];

  return (
    <Flex bg={"neutral.c30"} borderRadius={2}>
      <Flex flexDirection={"row"} justifyContent={"space-between"} alignItems={"flex-start"} p={6}>
        <Flex>
          <Flex flexDirection={"row"} alignItems={"center"} mb={1}>
            <Text
              variant={"small"}
              fontWeight={"semiBold"}
              color={"neutral.c70"}
              textTransform={"uppercase"}
              mr={2}
            >
              {headerText}
            </Text>
            <DiscreetModeButton size={20} />
          </Flex>
          <>
            <Flex>
              <Text
                fontFamily="Inter"
                fontWeight="semiBold"
                fontSize="30px"
                color={"neutral.c100"}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                <CurrencyUnitValue unit={counterValueUnit} value={0} joinFragmentsSeparator=" " />
              </Text>
            </Flex>
          </>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default memo(withDiscreetMode(ReadOnlyGraphCard));
