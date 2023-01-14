import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import {
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { usePickDefaultAccount } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { useSelector } from "react-redux";
import { Selector } from "./Selector";
import { AmountInput } from "./AmountInput";
import { shallowAccountsSelector } from "../../../../reducers/accounts";
import { SwapFormParamList } from "../../types";
import { fromSelector, pairsSelector } from "../../../../actions/swap";
import TranslatedError from "../../../../components/TranslatedError";
import { ScreenName } from "../../../../const";
import { useAnalytics } from "../../../../analytics";
import { sharedSwapTracking } from "../../utils";

interface Props {
  provider?: string;
  swapTx: SwapTransactionType;
  swapError?: Error;
  isSendMaxLoading: boolean;
}

export function From({ swapTx, provider, swapError, isSendMaxLoading }: Props) {
  const { track } = useAnalytics();
  const { t } = useTranslation();
  const navigation = useNavigation<SwapFormParamList>();

  const accounts = useSelector(fromSelector)(
    useSelector(shallowAccountsSelector),
  );
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

  usePickDefaultAccount(
    accounts,
    swapTx.swap.from.account,
    swapTx.setFromAccount,
  );

  const pairs = useSelector(pairsSelector);

  const onPress = useCallback(() => {
    track("button_clicked", {
      ...sharedSwapTracking,
      button: "Edit source account",
    });
    // @ts-expect-error navigation type is only partially declared
    navigation.navigate(ScreenName.SwapSelectAccount, {
      target: "from",
      provider,
      selectableCurrencyIds: [...new Set(pairs.map(p => p.from))],
      swap: swapTx.swap,
    });
  }, [navigation, provider, pairs, swapTx.swap, track]);

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
    <Flex
      borderBottomWidth={1}
      borderColor="neutral.c70"
      paddingBottom={2}
      marginBottom={4}
    >
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
            />
          </Flex>
        </Flex>

        <Text color="error.c100" textAlign="right" variant="tiny">
          {swapError ? <TranslatedError error={swapError} /> : ""}
        </Text>
      </Flex>
    </Flex>
  );
}
