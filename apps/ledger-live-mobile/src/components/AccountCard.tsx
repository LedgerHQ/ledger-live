import React, { ReactNode } from "react";
import {
  getAccountName,
  getAccountSpendableBalance,
} from "@ledgerhq/live-common/account/index";
import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/account/helpers";
import {
  DerivationMode,
  getTagDerivationMode,
} from "@ledgerhq/coin-framework/derivation";
import { AccountLike } from "@ledgerhq/types-live";
import { Flex, Tag, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native-gesture-handler";

import { ViewStyle, StyleProp } from "react-native";
import Card, { Props as CardProps } from "./Card";
import CurrencyIcon from "./CurrencyIcon";
import CurrencyUnitValue from "./CurrencyUnitValue";

export type Props = CardProps & {
  account?: AccountLike | null;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  useFullBalance?: boolean;
  AccountSubTitle?: ReactNode;
};

const AccountCard = ({
  onPress,
  account,
  style,
  disabled,
  useFullBalance,
  AccountSubTitle,
  ...props
}: Props) => {
  const { colors } = useTheme();
  if (!account) return null;
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const tag =
    account.type === "Account" &&
    account?.derivationMode !== undefined &&
    account?.derivationMode !== null &&
    currency.type === "CryptoCurrency" &&
    getTagDerivationMode(currency, account.derivationMode as DerivationMode);

  return (
    <TouchableOpacity disabled={disabled} onPress={onPress}>
      <Card
        flexDirection="row"
        paddingY={4}
        alignItems="center"
        backgroundColor="transparent"
        style={style}
        {...props}
      >
        <CurrencyIcon
          currency={currency}
          disabled={disabled}
          color={colors.constant.white}
          size={32}
          circle
        />
        <Flex
          flexGrow={1}
          flexShrink={1}
          marginLeft={3}
          flexDirection="row"
          alignItems="center"
        >
          <Flex minWidth={20} flexShrink={1}>
            <Text
              variant="paragraph"
              fontWeight="semiBold"
              numberOfLines={1}
              color={disabled ? "neutral.c50" : "neutral.c100"}
              flexShrink={1}
            >
              {getAccountName(account)}
            </Text>
            {AccountSubTitle}
          </Flex>
          {tag && <Tag marginLeft={3}>{tag}</Tag>}
        </Flex>
        <Flex marginLeft={3} alignItems="flex-end">
          <Text variant="small" fontWeight="medium" color="neutral.c70">
            <CurrencyUnitValue
              showCode
              unit={unit}
              value={
                useFullBalance
                  ? account.balance
                  : getAccountSpendableBalance(account)
              }
            />
          </Text>
        </Flex>
      </Card>
    </TouchableOpacity>
  );
};

export default AccountCard;
