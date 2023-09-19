import React, { ReactNode } from "react";
import { getAccountSpendableBalance } from "@ledgerhq/live-common/account/index";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { DerivationMode, getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { Flex, Tag, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native-gesture-handler";

import { ViewStyle, StyleProp } from "react-native";
import Card, { Props as CardProps } from "./Card";
import CurrencyIcon from "./CurrencyIcon";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";

export type Props = CardProps & {
  account?: AccountLike | null;
  parentAccount?: Account;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  useFullBalance?: boolean;
  AccountSubTitle?: ReactNode;
  iconSize?: number;
};

const AccountCard = ({
  onPress,
  account,
  parentAccount,
  style,
  disabled,
  useFullBalance,
  AccountSubTitle,
  iconSize = 48,
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
    <TouchableOpacity disabled={disabled} onPress={onPress} testID={"account-card-" + account.id}>
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
          size={iconSize}
          circle
        />
        <Flex flexGrow={1} flexShrink={1} marginLeft={4} flexDirection="row" alignItems="center">
          <Flex minWidth={20} flexShrink={1}>
            <Text
              variant="large"
              fontWeight="semiBold"
              numberOfLines={1}
              color={disabled ? "neutral.c50" : "neutral.c100"}
              flexShrink={1}
              testID={"test-id-account-" + account.name}
            >
              {account.type === "TokenAccount"
                ? parentAccount
                  ? `${parentAccount!.name} (${currency.ticker})`
                  : currency.ticker
                : account.name}
            </Text>
            {AccountSubTitle}

            {tag && (
              <Flex flexDirection="row">
                <Tag mt={2}>{tag}</Tag>
              </Flex>
            )}
          </Flex>
        </Flex>
        <Flex marginLeft={3} alignItems="flex-end">
          <Text variant="large" fontWeight="semiBold" color="neutral.c100" mb={2}>
            <CounterValue currency={currency} value={account.balance} showCode />
          </Text>
          <Text variant="body" fontWeight="medium" color="neutral.c70">
            <CurrencyUnitValue
              showCode
              unit={unit}
              value={useFullBalance ? account.balance : getAccountSpendableBalance(account)}
            />
          </Text>
        </Flex>
      </Card>
    </TouchableOpacity>
  );
};

export default AccountCard;
