import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { getAccountName, getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  useFetchCurrencyFrom,
  usePickDefaultAccount,
  useSwapableAccounts,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { WarningSolidMedium } from "@ledgerhq/native-ui/assets/icons";
import { Selector } from "./Selector";
import { AmountInput } from "./AmountInput";
import { SwapFormParamList } from "../../types";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";
import { useAnalytics } from "~/analytics";
import { sharedSwapTracking } from "../../utils";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { useSelector } from "react-redux";

interface Props {
  provider?: string;
  swapTx: SwapTransactionType;
  swapError?: Error;
  swapWarning?: Error;
  isSendMaxLoading: boolean;
}

export function From({ swapTx, provider, swapError, swapWarning, isSendMaxLoading }: Props) {
  const { track } = useAnalytics();
  const { t } = useTranslation();
  const navigation = useNavigation<SwapFormParamList>();
  const { data: currenciesFrom } = useFetchCurrencyFrom();
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const accounts = useSwapableAccounts({ accounts: flattenedAccounts });
  const { name, balance, unit } = useMemo(() => {
    const { currency, account } = swapTx.swap.from;

    return {
      account,
      name: account && getAccountName(account),
      balance:
        (account &&
          currency &&
          formatCurrencyUnit(currency.units[0], account.balance, {
            showCode: true,
          })) ??
        "",
      unit: account && getAccountUnit(account),
    };
  }, [swapTx.swap.from]);

  usePickDefaultAccount(accounts, swapTx.swap.from.account, swapTx.setFromAccount);

  const onPress = useCallback(() => {
    track("button_clicked", {
      ...sharedSwapTracking,
      button: "Edit source account",
    });
    // @ts-expect-error navigation type is only partially declared
    navigation.navigate(ScreenName.SwapSelectAccount, {
      target: "from",
      provider,
      selectableCurrencyIds: currenciesFrom,
      swap: swapTx.swap,
    });
  }, [navigation, provider, currenciesFrom, swapTx.swap, track]);

  const onFocus = useCallback(
    (event: boolean) => {
      if (event) {
        track("button_clicked", {
          ...sharedSwapTracking,
          button: "Amount input",
          amount: null,
        });
      }
    },
    [track],
  );

  return (
    <Flex borderBottomWidth={1} borderColor="neutral.c70" paddingBottom={2} marginBottom={4}>
      <Text variant="small" marginBottom={2}>
        {t("transfer.swap2.form.from")}
      </Text>
      <Flex>
        <Flex flexDirection="row" justifyContent="space-between" width="100%">
          <Flex flex={1} justifyContent="center">
            <Selector
              currency={swapTx.swap.from.currency}
              title={name}
              subTitle={balance}
              onPress={onPress}
              testID="swap-source-selector"
            />
          </Flex>

          <Flex flex={1} justifyContent="center">
            <AmountInput
              value={swapTx.swap.from.amount}
              editable={!swapTx.swap.isMaxEnabled}
              loading={isSendMaxLoading}
              unit={unit}
              onChange={swapTx.setFromAmount}
              onFocus={onFocus}
              error={swapError}
              warning={swapWarning}
              testID="swap-source-amount-textbox"
            />
          </Flex>
        </Flex>

        {swapError || swapWarning ? (
          <Flex flexDirection="row" columnGap={8} alignItems="center">
            <WarningSolidMedium size={20} color={swapError ? "error.c50" : "orange"} />
            <Text
              marginY={4}
              color={swapError ? "error.c50" : "orange"}
              textAlign="left"
              fontWeight="medium"
              lineHeight="20.4px"
              variant="small"
            >
              <TranslatedError error={swapError || swapWarning} />
            </Text>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
}
