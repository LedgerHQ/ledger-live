import { Strategy } from "@ledgerhq/coin-evm/lib/types/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import { StrategyIcon } from "./StrategyIcon";

type Props = {
  strategy: Strategy;
  active: boolean;
  onSelect(): void;
  gasOption?: BigNumber;
  feePayingAccount: Account;
};

export function FeeContainer({ strategy, active, onSelect, gasOption, feePayingAccount }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const unit = useMemo(() => feePayingAccount.currency.units[0], [feePayingAccount.currency]);

  const magnitudeAwareGasOption = useMemo(() => {
    return formatCurrencyUnit(unit, gasOption ?? BigNumber(0));
  }, [gasOption, unit]);

  if (!gasOption) return null;

  return (
    <TouchableOpacity onPress={onSelect}>
      <Flex
        flexDirection="column"
        border={1.5}
        borderColor={active ? colors.opacityPurple.c30 : "transparent"}
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
              {t(`fees.estimatedTime.${strategy}`)}
            </Text>
          </Flex>
          <Flex flexDirection="column" ml="auto">
            <Text variant="large" textAlign="right">
              {magnitudeAwareGasOption.toString()}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
