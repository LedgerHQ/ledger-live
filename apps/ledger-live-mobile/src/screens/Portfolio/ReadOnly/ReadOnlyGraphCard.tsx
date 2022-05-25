import React, { memo } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { withDiscreetMode } from "../../../context/DiscreetModeContext";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import DiscreetModeButton from "../../../components/DiscreetModeButton";

import getWindowDimensions from "../../../logic/getWindowDimensions";
import Graph from "../../../icons/Graph";

type Props = {
  counterValueCurrency: Currency;
};

function GraphCard({ counterValueCurrency }: Props) {
  const { t } = useTranslation();

  const unit = counterValueCurrency.units[0];

  const { colors } = useTheme();

  return (
    <Flex bg={"neutral.c30"} borderRadius={2}>
      <Flex
        flexDirection={"row"}
        justifyContent={"space-between"}
        alignItems={"flex-start"}
        p={6}
      >
        <Flex>
          <Flex flexDirection={"row"} alignItems={"center"} mb={1}>
            <Text
              variant={"small"}
              fontWeight={"semiBold"}
              color={"neutral.c70"}
              textTransform={"uppercase"}
              mr={2}
            >
              {t("tabs.portfolio")}
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
                <CurrencyUnitValue
                  unit={unit}
                  value={0}
                  joinFragmentsSeparator=" "
                />
              </Text>
            </Flex>
          </>
        </Flex>
      </Flex>

      <Graph
        width={getWindowDimensions().width - 32}
        color={colors.neutral.c40}
      />
    </Flex>
  );
}

export default withDiscreetMode(memo<Props>(GraphCard));
