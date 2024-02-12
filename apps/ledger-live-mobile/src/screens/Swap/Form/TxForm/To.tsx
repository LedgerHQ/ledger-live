import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import { ExchangeRate, SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { useNavigation } from "@react-navigation/native";
import {
  useFetchCurrencyTo,
  usePickDefaultCurrency,
  useSelectableCurrencies,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { Selector } from "./Selector";
import { CurrencyValue } from "./CurrencyValue";
import { ScreenName } from "~/const";
import { useAnalytics } from "~/analytics";
import { sharedSwapTracking } from "../../utils";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";

interface Props {
  swapTx: SwapTransactionType;
  provider?: string;
  exchangeRate?: ExchangeRate;
}

export function To({ swapTx, provider, exchangeRate }: Props) {
  const { track } = useAnalytics();
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigatorNavigation<SwapNavigatorParamList>>();

  const allCurrencies = useFetchCurrencyTo({ fromCurrencyAccount: swapTx.swap.from.account });
  const currencies = useSelectableCurrencies({ allCurrencies: allCurrencies.data ?? [] });

  usePickDefaultCurrency(currencies, swapTx.swap.to.currency, swapTx.setToCurrency);

  const onPress = useCallback(() => {
    track("button_clicked", {
      ...sharedSwapTracking,
      button: "edit target account",
    });
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
