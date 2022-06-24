import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import {
  Currency,
  Unit,
} from "@ledgerhq/live-common/lib/types";
import { Flex, ProgressLoader, Text, Tag } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { BigNumber } from "bignumber.js";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import { ensureContrast } from "../../colors";
import Delta from "../../components/Delta";
import ParentCurrencyIcon from "../../components/ParentCurrencyIcon";
import { ValueChange } from "../../../../libs/ledger-live-common/src/portfolio/v2/types";

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

const AccountRowLayout = ({
  balance,
  currency,
  currencyUnit,
  name,
  onPress,
  hideDelta,
  topLink,
  bottomLink,
  progress,
  countervalueChange,
  tag,
}: Props) => {
  const { colors, space } = useTheme();

  const color = useMemo(
    () => ensureContrast(getCurrencyColor(currency), colors.constant.white),
    [colors, currency],
  );

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
      <Flex flexDirection="row" pt={topLink ? 0 : 6} pb={bottomLink ? 0 : 6}>
        <Flex pr={4}>
          <ProgressLoader
            strokeWidth={2}
            mainColor={color}
            secondaryColor={colors.neutral.c40}
            progress={progress}
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
              {tag && (
                <Flex mx={3} flexShrink={0}>
                  <Tag>{tag}</Tag>
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

export default React.memo<Props>(AccountRowLayout);
