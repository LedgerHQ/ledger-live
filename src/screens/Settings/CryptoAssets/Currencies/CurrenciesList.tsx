import React, { useCallback } from "react";
import { StyleSheet, FlatList } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { Box, Text } from "@ledgerhq/native-ui";
import { ScreenName } from "../../../../const";
import { cryptoCurrenciesSelector } from "../../../../reducers/accounts";
import SettingsRow from "../../../../components/SettingsRow";
import CurrencyIcon from "../../../../components/CurrencyIcon";

type Props = {
  navigation: any,
  currencies: CryptoCurrency[],
};

const mapStateToProps = createStructuredSelector({
  currencies: cryptoCurrenciesSelector,
});


function CurrenciesList({ navigation, currencies }: Props) {
  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <SettingsRow
        event="CurrenciesList"
        eventProperties={{ currency: item.id }}
        title={(
          <>
            {item.name}
            {"  "}
            <Text variant={"body"} fontWeight={"medium"} color={"neutral.c70"} ml={3}>
              {item.ticker}
            </Text>
          </>
        )}
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
  
  const keyExtractor = useCallback(item => item.id, []);

  return (
    <Box backgroundColor={'background.main'} height={'100%'}>
      <FlatList
        data={currencies}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.containerStyle}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  containerStyle: { paddingTop: 16, paddingBottom: 64, paddingHorizontal: 16, },
});

export default connect(mapStateToProps)(CurrenciesList)
