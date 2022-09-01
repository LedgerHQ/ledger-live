import React from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { USStates } from "@ledgerhq/live-common/exchange/swap/index";
import makeGenericSelectScreen from "../../makeGenericSelectScreen";
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

type RouteProps = RouteProp<{
  params: {
    onStateSelect: (_: { value: string; label: string }) => void;
  };
}>;

const StateSelect = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
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
};

export default StateSelect;
