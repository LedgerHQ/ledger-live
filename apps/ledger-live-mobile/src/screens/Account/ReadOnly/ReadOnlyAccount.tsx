import React, { useCallback, useContext } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useSelector } from "~/context/store";
import { Trans, useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useFocusEffect } from "@react-navigation/native";
import ReadOnlyGraphCard from "~/components/ReadOnlyGraphCard";
import ReadOnlyFabActions from "~/components/FabActions/ReadOnlyFabActions";
import GradientContainer from "~/components/GradientContainer";
import BuyDeviceBanner, {
  IMAGE_PROPS_BUY_DEVICE_FLEX,
} from "LLM/features/Reborn/components/BuyDeviceBanner";
import SetupDeviceBanner from "LLM/features/Reborn/components/SetupDeviceBanner";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { TrackScreen } from "~/analytics";

import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { counterValueCurrencySelector, hasOrderedNanoSelector } from "~/reducers/settings";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import type { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useCurrencyById } from "@ledgerhq/cryptoassets/hooks";

type Props = StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Account>;

function ReadOnlyAccount({ route }: Props) {
  const { currencyId } = route.params;

  const { currency } = useCurrencyById(currencyId || "");
  const { t } = useTranslation();

  const counterValueCurrency: Currency = useSelector(counterValueCurrencySelector);

  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<React.JSX.Element>) => item, []);
  const keyExtractor = useCallback((_: React.JSX.Element, index: number) => String(index), []);

  const { source, setSource, setScreen } = useContext(AnalyticsContext);

  useFocusEffect(
    useCallback(() => {
      setScreen && setScreen("Account");

      return () => {
        setSource("Account");
      };
    }, [setSource, setScreen]),
  );

  if (!currency) return null;

  const data = [
    <Box mx={6} my={6} key="ReadOnlyGraphCard">
      <ReadOnlyGraphCard
        counterValueCurrency={counterValueCurrency}
        headerText={
          <CurrencyUnitValue unit={currency.units[0]} value={0} joinFragmentsSeparator=" " />
        }
      />
    </Box>,
    <Box py={3} key="ReadOnlyFabActions">
      <ReadOnlyFabActions />
    </Box>,
    <Box mt={8} key="GradientContainer">
      <GradientContainer containerStyle={{ marginHorizontal: 16 }}>
        <Flex flex={1} px={10} py={11} alignItems="center" justifyContent="center">
          <Text variant="large" fontWeight="semiBold" color="neutral.c100" textAlign="center">
            {t("account.readOnly.noTransaction.title")}
          </Text>
          <Text variant="small" fontWeight="medium" color="neutral.c70" textAlign="center" mt={3}>
            <Trans
              i18nKey={"account.readOnly.noTransaction.subtitle"}
              values={{ assetName: currency.name }}
            />
          </Text>
        </Flex>
      </GradientContainer>
    </Box>,
    <Box mt={8} key="Banner">
      {hasOrderedNano ? (
        <SetupDeviceBanner screen="Assets" />
      ) : (
        <BuyDeviceBanner
          {...IMAGE_PROPS_BUY_DEVICE_FLEX}
          buttonLabel={t("buyDevice.bannerButtonTitle")}
          buttonSize="small"
          event="button_clicked"
          eventProperties={{
            button: "Discover the Nano",
            page: "Account",
            currency: currency.name,
          }}
          screen="Account"
        />
      )}
    </Box>,
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
      <TrackScreen category="Account" currency={currency.name} operationsSize={0} source={source} />
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

export default React.memo(withDiscreetMode(ReadOnlyAccount));
