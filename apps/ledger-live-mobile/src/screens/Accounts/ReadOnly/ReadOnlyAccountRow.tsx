import React, { useCallback, useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import { Flex, Text, ProgressLoader } from "@ledgerhq/native-ui";
import { Currency } from "@ledgerhq/live-common/lib/types";
import { useTheme } from "styled-components/native";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import { ensureContrast } from "../../../colors";
import { NavigatorName, ScreenName } from "../../../const";
import ParentCurrencyIcon from "../../../components/ParentCurrencyIcon";

type Props = {
  currency: Currency;
  navigation: any;
};

const ReadOnlyAccountRow = ({ navigation, currency }: Props) => {
  const { colors } = useTheme();

  const { name, units, id, type } = currency;

  const color = useMemo(
    () => ensureContrast(getCurrencyColor(currency), colors.constant.white),
    [colors, currency],
  );

  const onAccountPress = useCallback(() => {
    navigation.navigate(NavigatorName.Portfolio, {
      screen: NavigatorName.PortfolioAccounts,
      params: {
        screen: ScreenName.Account,
        params: {
          currencyId: id,
          currencyType: type,
        },
      },
    });
  }, [navigation, id, type]);

  return (
    <TouchableOpacity onPress={onAccountPress}>
      <Flex flexDirection="row" pt={6} pb={6}>
        <Flex pr={4}>
          <ProgressLoader
            strokeWidth={2}
            mainColor={color}
            secondaryColor={colors.neutral.c40}
            progress={0}
            radius={22}
          >
            <ParentCurrencyIcon currency={currency} size={32} />
          </ProgressLoader>
        </Flex>
        <Flex flex={1} justifyContent="center">
          <Flex mb={1} flexDirection="row" justifyContent="space-between">
            <Flex
              flexGrow={1}
              flexShrink={1}
              flexDirection="row"
              alignItems="center"
            >
              <Flex flexShrink={1}>
                <Text
                  variant="large"
                  fontWeight="semiBold"
                  color="neutral.c100"
                  numberOfLines={1}
                  flexShrink={1}
                >
                  {name}
                </Text>
              </Flex>
            </Flex>
            <Flex flexDirection="row" alignItems="flex-end" flexShrink={0}>
              <Text variant="large" fontWeight="semiBold" color="neutral.c100">
                <CounterValue
                  currency={currency}
                  value={0}
                  joinFragmentsSeparator=""
                />
              </Text>
            </Flex>
          </Flex>
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="body" fontWeight="medium" color="neutral.c70">
              <CurrencyUnitValue showCode unit={units[0]} value={0} />
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
};

export default React.memo<Props>(ReadOnlyAccountRow);
