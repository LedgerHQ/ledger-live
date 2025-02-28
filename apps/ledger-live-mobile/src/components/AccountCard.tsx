import React, { ReactNode } from "react";
import { getAccountCurrency, getParentAccount } from "@ledgerhq/live-common/account/helpers";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { AccountLike, Account, DerivationMode } from "@ledgerhq/types-live";
import { Flex, Tag, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native-gesture-handler";

import { ViewStyle, StyleProp } from "react-native";
import Card, { Props as CardProps } from "./Card";
import CurrencyIcon from "./CurrencyIcon";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";
import { useMaybeAccountName } from "~/reducers/wallet";
import { useMaybeAccountUnit } from "~/hooks/useAccountUnit";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/reducers/accounts";

export type Props = CardProps & {
  account?: AccountLike | null;
  parentAccount?: Account;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  useFullBalance?: boolean;
  AccountSubTitle?: ReactNode;
  iconSize?: number;
  overridesName?: string;
};

const AccountCard = ({
  onPress,
  account,
  parentAccount,
  style,
  disabled,
  useFullBalance,
  AccountSubTitle,
  overridesName,
  iconSize = 48,
  ...props
}: Props) => {
  const { colors } = useTheme();
  const accounts = useSelector(accountsSelector);

  const accountNameFromStore = useMaybeAccountName(account);
  const accountName = overridesName || accountNameFromStore;
  const parentName = useMaybeAccountName(
    parentAccount || (account ? getParentAccount(account, accounts) : undefined),
  );
  const unit = useMaybeAccountUnit(account);
  if (!account || !unit) return null;
  const currency = getAccountCurrency(account);
  const tag =
    account.type === "Account" &&
    account?.derivationMode !== undefined &&
    account?.derivationMode !== null &&
    currency.type === "CryptoCurrency" &&
    getTagDerivationMode(currency, account.derivationMode as DerivationMode);
  const name =
    account.type === "TokenAccount"
      ? parentName
        ? `${parentName} (${currency.ticker})`
        : currency.ticker
      : accountName;
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
              testID={"test-id-account-" + name}
            >
              {name}
            </Text>
            {AccountSubTitle}

            {tag && (
              <Flex flexDirection="row">
                <Tag mt={2} numberOfLines={1}>
                  {tag}
                </Tag>
              </Flex>
            )}
          </Flex>
        </Flex>
        <Flex marginLeft={3} alignItems="flex-end">
          <Text variant="large" fontWeight="semiBold" color="neutral.c100" mb={2}>
            <CounterValue
              currency={currency}
              value={useFullBalance ? account.balance : account.spendableBalance}
              showCode
            />
          </Text>
          <Text variant="body" fontWeight="medium" color="neutral.c70">
            <CurrencyUnitValue
              showCode
              unit={unit}
              value={useFullBalance ? account.balance : account.spendableBalance}
            />
          </Text>
        </Flex>
      </Card>
    </TouchableOpacity>
  );
};

export default AccountCard;
