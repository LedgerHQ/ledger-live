import React from "react";
import { getAccountSpendableBalance } from "@ledgerhq/live-common/account/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { ViewStyle, StyleProp } from "react-native";
import Card, { Props as CardProps } from "~/components/Card";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import { useMaybeAccountName } from "~/reducers/wallet";
import { useMaybeAccountUnit } from "~/hooks/useAccountUnit";

export type Props = CardProps & {
  account?: AccountLike | null;
  parentAccount?: Account;
  style?: StyleProp<ViewStyle>;
};

const AccountInfo = ({ onPress, account, parentAccount, style, ...props }: Props) => {
  const { colors } = useTheme();
  const accountName = useMaybeAccountName(account);
  const parentName = useMaybeAccountName(parentAccount);
  const unit = useMaybeAccountUnit(account);
  if (!account || !unit) return null;
  const currency = getAccountCurrency(account);

  const accountId = account.id.slice(0, 4) + "..." + account.id.slice(-4);

  const name =
    account.type === "TokenAccount"
      ? parentAccount
        ? `${parentName} (${currency.ticker})`
        : currency.ticker
      : accountName;

  return (
    <TouchableOpacity onPress={onPress} testID={"account-card-" + account.id}>
      <Card
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="translucentGrey"
        style={style}
        {...props}
      >
        <Flex rowGap={6}>
          <Text variant="large" fontWeight="semiBold" numberOfLines={1} flexShrink={1}>
            {name}
          </Text>

          <Flex flexDirection="row" columnGap={5}>
            <Text variant="large" fontWeight="semiBold" color="neutral.c70">
              {accountId}
            </Text>
            <CurrencyIcon currency={currency} color={colors.constant.white} size={18} circle />
          </Flex>
        </Flex>
        <Flex marginLeft={3} alignItems="flex-end">
          <Text variant="large" fontWeight="semiBold" mb={2}>
            <CounterValue currency={currency} value={account.balance} showCode />
          </Text>
          <Text variant="body" fontWeight="medium" color="neutral.c70">
            <CurrencyUnitValue showCode unit={unit} value={getAccountSpendableBalance(account)} />
          </Text>
        </Flex>
      </Card>
    </TouchableOpacity>
  );
};

export default AccountInfo;
