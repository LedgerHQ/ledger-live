import React, { useCallback, useMemo } from "react";
import { TouchableOpacity } from "react-native";
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import {
  Account,
  Currency,
  TokenAccount,
  CryptoCurrency,
} from "@ledgerhq/live-common/lib/types";
import { getTagDerivationMode } from "@ledgerhq/live-common/lib/derivation";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import CurrencyIcon from "../../components/CurrencyIcon";
import { ensureContrast } from "../../colors";
import { ScreenName } from "../../const";

type Props = {
  currency: Currency;
  navigation: any;
};

const AccountRow = ({ navigation, currency }: Props) => {
  const { colors } = useTheme();

  //   const currency = getAccountCurrency(account);
  //   const name = getAccountName(account);
  //   const unit = getAccountUnit(account);
  const name = "BTC";
  const unit = {
    name: "BTC",
    code: "BTC",
    magnitude: 2,
  };

  const tag =
    account.derivationMode !== undefined &&
    account.derivationMode !== null &&
    getTagDerivationMode(currency as CryptoCurrency, account.derivationMode);

  const color = useMemo(
    () => ensureContrast(getCurrencyColor(currency), colors.constant.white),
    [colors, currency],
  );

  const onAccountPress = useCallback(() => {
    navigation.navigate(ScreenName.Account, { accountId: "BTC" });
  }, [navigation]);

  return (
    <TouchableOpacity onPress={onAccountPress}>
      <Flex flexDirection="row" pt={6} pb={6}>
        <Flex pr={4}>
          <Flex
            bg={color}
            width={"32px"}
            height={"32px"}
            alignItems={"center"}
            justifyContent={"center"}
            borderRadius={32}
          >
            <CurrencyIcon
              currency={currency}
              size={20}
              color={colors.constant.white}
            />
          </Flex>
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
              <CurrencyUnitValue showCode unit={unit} value={0} />
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
};

export default React.memo<Props>(AccountRow);
