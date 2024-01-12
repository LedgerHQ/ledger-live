import React, { useCallback, useMemo } from "react";
import { StyleSheet, FlatList } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Box, Text } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import { cryptoCurrenciesSelector } from "~/reducers/accounts";
import SettingsRow from "~/components/SettingsRow";
import CurrencyIcon from "~/components/CurrencyIcon";
import { getCurrencyHasSettings } from "./CurrencySettings";
import { State } from "~/reducers/types";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type Props = {
  currencies: CryptoCurrency[];
};

const mapStateToProps = createStructuredSelector<State, { currencies: CryptoCurrency[] }>({
  currencies: cryptoCurrenciesSelector,
});

function CurrenciesList({
  navigation,
  currencies,
}: Props & StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.CryptoAssetsSettings>) {
  const currenciesWithSetting = useMemo(
    () => currencies.filter(getCurrencyHasSettings),
    [currencies],
  );

  const renderItem = useCallback(
    ({ item }: { item: CryptoCurrency }) => (
      <SettingsRow
        event="CurrenciesList"
        eventProperties={{ currency: item.id }}
        title={
          <>
            {item.name}
            {"  "}
            <Text variant={"body"} fontWeight={"medium"} color={"neutral.c70"} ml={3}>
              {item.ticker}
            </Text>
          </>
        }
        iconLeft={<CurrencyIcon size={20} currency={item} />}
        key={item.id}
        onPress={() =>
          navigation.navigate(ScreenName.CurrencySettings, {
            currencyId: item.id,
          })
        }
        compact
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item: CryptoCurrency) => item.id, []);

  return (
    <Box backgroundColor={"background.main"} height={"100%"}>
      <FlatList
        data={currenciesWithSetting}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.containerStyle}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  containerStyle: { paddingTop: 16, paddingBottom: 64, paddingHorizontal: 16 },
});

export default connect(mapStateToProps)(CurrenciesList);
