import { Strategy } from "@ledgerhq/coin-evm/lib/types/index";
import { SpeedFast, SpeedLow, SpeedMedium } from "@ledgerhq/icons-ui/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { StrategyIcon } from "./StrategyIcon";
import { TouchableOpacity } from "react-native";

type Props = {
  strategy: Strategy;
  active: boolean;
  onSelect(): void,
};

export function FeeContainer({ strategy, active, onSelect }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={onSelect}>
      <Flex
        flexDirection="column"
        border={1.5}
        borderColor={active ? colors.opacityPurple.c30 : 'transparent'}
        backgroundColor={active ? colors.opacityPurple.c20 : colors.opacityDefault.c05}
        borderRadius={12}
        p={16}
      >
        <Flex flexDirection="row" alignItems="center" columnGap={8}>
          <StrategyIcon strategy={strategy} active={active} />
          <Flex flexDirection="column">
            <Text variant="large" textTransform="capitalize">
              {t(`fees.speed.${strategy}`)}
            </Text>
            <Text variant="small" color={colors.opacityDefault.c50}>
              {"≈ 2-3 min"}
            </Text>
          </Flex>
          <Flex flexDirection="column" ml="auto">
            <Text variant="large" textAlign="right">
              {"0.0053 ETH"}
            </Text>
            <Text variant="small" textAlign="right" color={colors.opacityDefault.c50}>
              {"$12.00"}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
