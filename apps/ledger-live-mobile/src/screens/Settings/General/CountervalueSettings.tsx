import { connect } from "react-redux";
import { setCountervalue } from "~/actions/settings";
import { counterValueCurrencySelector, supportedCounterValuesSelector } from "~/reducers/settings";
import { State } from "~/reducers/types";
import makeGenericSelectScreen from "../../makeGenericSelectScreen";

const mapStateToProps = (state: State) => ({
  selectedKey: counterValueCurrencySelector(state).ticker,
  items: supportedCounterValuesSelector(state),
});

const mapDispatchToProps = {
  onValueChange: ({ value }: { value: string }) => setCountervalue(value),
};

const Screen = makeGenericSelectScreen({
  id: "CounterValueSettingsSelect",
  itemEventProperties: item => ({ countervalue: item.value }),
  keyExtractor: item => item.value,
  formatItem: item => item.label,
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
