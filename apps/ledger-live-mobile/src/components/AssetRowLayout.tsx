import React from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import { BigNumber } from "bignumber.js";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { Flex, Text, Tag } from "@ledgerhq/native-ui";
import { ValueChange } from "@ledgerhq/live-common/portfolio/v2/index";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";
import Delta from "./Delta";
import ParentCurrencyIcon from "./ParentCurrencyIcon";

type Props = {
  balance: BigNumber;
  currency: Currency;
  currencyUnit?: Unit;
  countervalueChange?: ValueChange;
  name: string;
  tag?: string | null | boolean;
  onPress?: () => void;
  progress?: number;
  hideDelta?: boolean;
  topLink?: boolean;
  bottomLink?: boolean;
};

const AssetRowLayout = ({
  balance,
  currency,
  currencyUnit,
  name,
  onPress,
  hideDelta,
  topLink,
  bottomLink,
  countervalueChange,
  tag,
}: Props) => {
  const { colors, space } = useTheme();

  return (
    <TouchableOpacity onPress={onPress}>
      {topLink && (
        <Flex
          width="1px"
          height={space[4]}
          marginLeft="21px"
          backgroundColor={colors.neutral.c40}
          mb={2}
        />
      )}
      <Flex
        flexDirection="row"
        pt={topLink ? 0 : 6}
        pb={bottomLink ? 0 : 6}
        alignItems="center"
      >
        <ParentCurrencyIcon currency={currency} size={40} />
        <Flex flex={1} justifyContent="center" ml={4}>
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
              {tag && (
                <Flex mx={3} flexShrink={0}>
                  <Tag numberOfLines={1}>{tag}</Tag>
                </Flex>
              )}
            </Flex>
            <Flex flexDirection="row" alignItems="flex-end" flexShrink={0}>
              <Text variant="large" fontWeight="semiBold" color="neutral.c100">
                <CounterValue
                  currency={currency}
                  value={balance}
                  joinFragmentsSeparator=""
                />
              </Text>
            </Flex>
          </Flex>
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="body" fontWeight="medium" color="neutral.c70">
              <CurrencyUnitValue showCode unit={currencyUnit} value={balance} />
            </Text>
            {!hideDelta && countervalueChange && (
              <Delta
                percent
                show0Delta={balance.toNumber() !== 0}
                fallbackToPercentPlaceholder
                valueChange={countervalueChange}
              />
            )}
          </Flex>
        </Flex>
      </Flex>
      {bottomLink && (
        <Flex
          width="1px"
          height={space[4]}
          marginLeft="21px"
          backgroundColor={colors.neutral.c40}
          mt={2}
        />
      )}
    </TouchableOpacity>
  );
};

export default React.memo<Props>(AssetRowLayout);
