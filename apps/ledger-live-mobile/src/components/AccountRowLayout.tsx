import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { ValueChange } from "@ledgerhq/types-live";
import { Flex, ProgressLoader, Text, Tag } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { BigNumber } from "bignumber.js";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import { ensureContrast } from "../../colors";
import Delta from "../../components/Delta";
import ParentCurrencyIcon from "../../components/ParentCurrencyIcon";
import counterValueFormatter from "../../../../libs/ledger-live-common/lib-es/market/utils/countervalueFormatter";

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
  topLink,
  bottomLink,
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
      <Flex flexDirection="row" pt={topLink ? 0 : 6} pb={bottomLink ? 0 : 6}>
        <Flex
          flex={1}
          flexDirection="row"
          justifyContent="space-between"
          alignItems={"center"}
          bg={"pink"}
        >
          <Flex
            flexDirection="column"
            alignItems={"flex-start"}
            bg={"red"}
            flexShrink={1}
            flexGrow={1}
          >
            <Flex
              flexGrow={1}
              flexDirection="row"
              alignItems="space-between"
              bg={"yellow"}
            >
              <Flex flexGrow={1} bg={"blue"}>
                <Text
                  variant="large"
                  fontWeight="semiBold"
                  color="neutral.c100"
                  numberOfLines={1}
                  flexGrow={1}
                  bg={"purple"}
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

            <Tag type={"main"} active={true}>
              test
            </Tag>
          </Flex>

          <Flex
            flexDirection="column"
            justifyContent={"flex-end"}
            alignItems={"flex-end"}
          >
            <Text
              variant="body"
              fontWeight="medium"
              color="neutral.c70"
              bg={"green"}
            >
              <CurrencyUnitValue showCode unit={currencyUnit} value={balance} />
            </Text>
            <Text
              variant="large"
              fontWeight="semiBold"
              color="neutral.c100"
              bg={"gray"}
            >
              <CounterValue
                currency={currency}
                value={balance}
                joinFragmentsSeparator=""
              />
            </Text>
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
