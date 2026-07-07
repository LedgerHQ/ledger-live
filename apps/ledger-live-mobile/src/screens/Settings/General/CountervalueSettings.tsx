import { connect } from "react-redux";
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

const Screen = makeGenericSelectScreen<supportedCountervaluesData>({
  id: "CounterValueSettingsSelect",
  itemEventProperties: item => ({ countervalue: item.value }),
  keyExtractor: item => item.value,
  formatItem: item => item.label,
  flatListTestID: "counter-value-settings-flat-list",
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
