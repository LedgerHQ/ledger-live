import React from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { ValueChange } from "@ledgerhq/types-live";
import { Flex, Text, Tag, Icons } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { BigNumber } from "bignumber.js";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";

type Props = {
  balance: BigNumber;
  currency: Currency;
  currencyUnit?: Unit;
  countervalueChange?: ValueChange;
  name: string;
  parentAccountName?: string;
  tag?: string | null | boolean;
  onPress?: TouchableOpacityProps["onPress"];
  progress?: number;
  hideDelta?: boolean;
  topLink?: boolean;
  bottomLink?: boolean;
  isLast?: boolean;
};

const AccountRowLayout = ({
  balance,
  currency,
  currencyUnit,
  name,
  parentAccountName,
  onPress,
  topLink,
  bottomLink,
  tag,
  isLast,
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
        pb={bottomLink || isLast ? 0 : 6}
      >
        <Flex
          flex={1}
          flexDirection="row"
          justifyContent="space-between"
          alignItems={"center"}
        >
          <Flex
            flexDirection="column"
            alignItems={"flex-start"}
            flexShrink={1}
            flexGrow={1}
            mr={4}
          >
            <Flex
              flexGrow={1}
              flexShrink={1}
              flexDirection="row"
              alignItems="center"
            >
              <Text
                variant="large"
                fontWeight="semiBold"
                color="neutral.c100"
                numberOfLines={1}
                flexGrow={0}
                flexShrink={1}
              >
                {name}
              </Text>
              {tag && (
                <Tag flexShrink={0} ml={3} numberOfLines={1}>
                  {tag}
                </Tag>
              )}
            </Flex>

            {parentAccountName && (
              <Tag
                type={"shade"}
                size={"small"}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {parentAccountName}
              </Tag>
            )}
          </Flex>

          <Flex
            flexDirection="column"
            justifyContent={"flex-end"}
            alignItems={"flex-end"}
            flexShrink={0}
            flexGrow={0}
            mr={3}
          >
            <Text variant="large" fontWeight="semiBold" color="neutral.c100">
              <CounterValue
                currency={currency}
                value={balance}
                joinFragmentsSeparator=""
              />
            </Text>
            {currencyUnit ? (
              <Text
                variant="body"
                fontWeight="medium"
                color="neutral.c70"
                flex={1}
              >
                <CurrencyUnitValue
                  showCode
                  unit={currencyUnit}
                  value={balance}
                />
              </Text>
            ) : null}
          </Flex>
          <Icons.ChevronRightMedium size={24} />
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
