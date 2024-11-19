import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Unit } from "@ledgerhq/types-cryptoassets";
import SettingsRow from "~/components/SettingsRow";
import NavigationScrollView from "~/components/NavigationScrollView";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { updateCurrencySettings } from "~/actions/settings";
import { State } from "~/reducers/types";
import { currencySettingsSelector } from "~/reducers/settings";

type NavigationProps = StackNavigatorProps<
  SettingsNavigatorStackParamList,
  ScreenName.EditCurrencyUnits
>;

export default function EditCurrencyUnits({ navigation, route }: NavigationProps) {
  const dispatch = useDispatch();
  const { currency } = route.params;

  const currencySettings = useSelector((s: State) =>
    currencySettingsSelector(s.settings, {
      currency,
    }),
  );

  const onPressItem = (item: Unit) => {
    dispatch(
      updateCurrencySettings({
        ticker: currency.ticker,
        patch: {
          unit: item,
        },
      }),
    );
    navigation.goBack();
  };

  const units = currency.units;
  const unit = currencySettings.unit;

  return (
    <NavigationScrollView>
      <View style={styles.body}>
        <FlatList
          data={units}
          keyExtractor={(item: Unit) => item.code}
          renderItem={({ item }) => (
            <SettingsRow
              title={item.code}
              selected={unit.code === item.code}
              compact
              onPress={() => onPressItem(item)}
            />
          )}
        />
      </View>
    </NavigationScrollView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 64,
  },
  body: {
    flexDirection: "column",
    flex: 1,
    padding: 16,
  },
});
