import React from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { USStates } from "@ledgerhq/live-common/exchange/swap/index";
import { StackNavigationProp } from "@react-navigation/stack";
import makeGenericSelectScreen from "../../../../makeGenericSelectScreen";
import type { StackNavigatorRoute } from "../../../../../components/RootNavigator/types/helpers";
import type { SwapNavigatorParamList } from "../../../../../components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "../../../../../const";
// NB for the first version we don't care about the country since only US is selected,
// this is the simplest select screen for only those states.
const Cmp = makeGenericSelectScreen({
  id: "StateSelect",
  itemEventProperties: item => ({
    state: item.value,
  }),
  keyExtractor: item => item.value,
  formatItem: item => item.label,
});

export function StateSelect() {
  const navigation =
    useNavigation<StackNavigationProp<{ [key: string]: object }>>();
  const route =
    useRoute<
      StackNavigatorRoute<SwapNavigatorParamList, ScreenName.SwapKYCStates>
    >();
  const items: { value: string; label: string }[] = Object.entries(
    USStates,
  ).map(([key, value]) => ({
    value: key,
    label: value,
  }));
  return (
    <Cmp
      items={items}
      onValueChange={state => {
        route?.params?.onStateSelect(state);
      }}
      navigation={navigation}
    />
  );
}
