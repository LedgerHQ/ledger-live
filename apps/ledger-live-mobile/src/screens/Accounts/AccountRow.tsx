import React, { useCallback, useMemo } from "react";
import { TouchableOpacity } from "react-native";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
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
import { Flex, ProgressLoader, Text, Tag } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import { useCalculate } from "@ledgerhq/live-common/lib/countervalues/react";
import { BigNumber } from "bignumber.js";
import { NavigatorName, ScreenName } from "../../const";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import { ensureContrast } from "../../colors";
import Delta from "../../components/Delta";
import { useBalanceHistoryWithCountervalue } from "../../actions/portfolio";
import { counterValueCurrencySelector } from "../../reducers/settings";
import ParentCurrencyIcon from "../../components/ParentCurrencyIcon";

type Props = {
  account: Account | TokenAccount;
  accountId: string;
  navigation: any;
  isLast: boolean;
  onSetAccount: (arg: TokenAccount) => void;
  portfolioValue: number;
  navigationParams?: any[];
  hideDelta?: boolean;
  topLink?: boolean;
  bottomLink?: boolean;
};

const AccountRow = ({
  navigation,
  account,
  accountId,
  portfolioValue,
  navigationParams,
  hideDelta,
  topLink,
  bottomLink,
}: Props) => {
  // makes it refresh if this changes
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const { colors, space } = useTheme();

  const currency = getAccountCurrency(account);
  const name = getAccountName(account);
  const unit = getAccountUnit(account);

  const tag =
    account.derivationMode !== undefined &&
    account.derivationMode !== null &&
    getTagDerivationMode(currency as CryptoCurrency, account.derivationMode);

  const color = useMemo(
    () => ensureContrast(getCurrencyColor(currency), colors.constant.white),
    [colors, currency],
  );

  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );

  const countervalue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value:
      account.balance instanceof BigNumber
        ? account.balance.toNumber()
        : account.balance,
    disableRounding: true,
  });

  const portfolioPercentage = useMemo(
    () => (countervalue ? countervalue / Math.max(1, portfolioValue) : 0), // never divide by potential zero, we dont want to go towards infinity
    [countervalue, portfolioValue],
  );

  const { countervalueChange } = useBalanceHistoryWithCountervalue({
    account,
    range: "day",
  });

  const onAccountPress = useCallback(() => {
    if (navigationParams) {
      navigation.navigate(...navigationParams);
    } else if (account.type === "Account") {
      navigation.navigate(NavigatorName.Portfolio, {
        screen: NavigatorName.PortfolioAccounts,
        params: {
          screen: ScreenName.Account,
          params: {
            accountId,
            isForwardedFromAccounts: true,
          },
        },
      });
    } else if (account.type === "TokenAccount") {
      navigation.navigate(NavigatorName.Portfolio, {
        screen: NavigatorName.PortfolioAccounts,
        params: {
          screen: ScreenName.Account,
          params: {
            parentId: account?.parentId,
            accountId: account.id,
          },
        },
      });
    }
  }, [account, accountId, navigation, navigationParams]);

  return (
    <TouchableOpacity onPress={onAccountPress}>
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
            progress={portfolioPercentage}
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
                  value={account.balance}
                  joinFragmentsSeparator=""
                />
              </Text>
            </Flex>
          </Flex>
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="body" fontWeight="medium" color="neutral.c70">
              <CurrencyUnitValue showCode unit={unit} value={account.balance} />
            </Text>
            {hideDelta ? null : (
              <Delta
                percent
                show0Delta={account.balance.toNumber() !== 0}
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

export default React.memo<Props>(AccountRow);
