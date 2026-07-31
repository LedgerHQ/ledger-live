import React from "react";
import { connect } from "react-redux";
import { useGetSupportedFiatsQuery } from "@domain/api-currency-fiat";
import { setCountervalue } from "~/actions/settings";
import {
  counterValueCurrencySelector,
  counterValueIdOf,
  supportedCounterValuesSelector,
} from "~/reducers/settings";
import { State, supportedCountervaluesData } from "~/reducers/types";
import makeGenericSelectScreen from "../../makeGenericSelectScreen";

const mapStateToProps = (state: State) => ({
  selectedKey: counterValueCurrencySelector(state).ticker,
  items: supportedCounterValuesSelector(state),
});

const mapDispatchToProps = {
  onValueChange: (item: supportedCountervaluesData) =>
    setCountervalue(counterValueIdOf(item.currency)),
};

const ConnectedScreen = connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  makeGenericSelectScreen<supportedCountervaluesData>({
    id: "CounterValueSettingsSelect",
    itemEventProperties: item => ({ countervalue: item.value }),
    keyExtractor: item => item.value,
    formatItem: item => item.label,
    flatListTestID: "counter-value-settings-flat-list",
  }),
);

export default function CountervalueSettings(props: React.ComponentProps<typeof ConnectedScreen>) {
  useGetSupportedFiatsQuery();
  return <ConnectedScreen {...props} />;
}
