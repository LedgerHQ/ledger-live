import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { ExchangeRate, SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { useNavigation } from "@react-navigation/native";
import {
  usePickDefaultCurrency,
  useSelectableCurrencies,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useSelector } from "react-redux";
import { Selector } from "./Selector";
import { CurrencyValue } from "./CurrencyValue";
import { toSelector } from "../../../../actions/swap";
import { ScreenName } from "../../../../const";
import { useAnalytics } from "../../../../analytics";
import { sharedSwapTracking } from "../../utils";

interface Props {
  swapTx: SwapTransactionType;
  provider?: string;
  exchangeRate?: ExchangeRate;
}

export function To({ swapTx, provider, exchangeRate }: Props) {
  const { track } = useAnalytics();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const fromCurrencyId = swapTx.swap.from.account
    ? getAccountCurrency(swapTx.swap.from.account).id
    : undefined;

  const allCurrencies = useSelector(toSelector)(fromCurrencyId);
  const currencies = useSelectableCurrencies({ allCurrencies });

  usePickDefaultCurrency(currencies, swapTx.swap.to.currency, swapTx.setToCurrency);

  const onPress = useCallback(() => {
    track("button_clicked", {
      ...sharedSwapTracking,
      button: "edit target account",
    });
    // @ts-expect-error navigation type is only partially declared
    navigation.navigate(ScreenName.SwapSelectCurrency, {
      currencies,
      provider,
    });
  }, [navigation, currencies, provider, track]);

  return (
    <Flex>
      <Text variant="small" marginBottom={2}>
        {t("transfer.swap2.form.to")}
      </Text>
      <Flex flexDirection="row" justifyContent="space-between" width="100%">
        <Flex flex={1} justifyContent="center">
          <Selector
            currency={swapTx.swap.to.currency}
            title={swapTx.swap.to.currency?.name}
            subTitle={swapTx.swap.to.currency?.units[0].code || "-"}
            onPress={onPress}
            disabled={!swapTx.swap.to.currency}
            testID="swap-destination-selector"
          />
        </Flex>

        <Flex flex={1} justifyContent="center">
          <CurrencyValue
            currency={swapTx.swap.to.currency}
            amount={exchangeRate?.toAmount}
            isLoading={swapTx.swap.rates.status === "loading"}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
