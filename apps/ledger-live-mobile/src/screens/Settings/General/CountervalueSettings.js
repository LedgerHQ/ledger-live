/* @flow */
import { connect } from "react-redux";
import { setCountervalue } from "../../../actions/settings";
import {
  counterValueCurrencySelector,
  supportedCountervalues,
} from "../../../reducers/settings";
import type { State } from "../../../reducers";
import makeGenericSelectScreen from "../../makeGenericSelectScreen";

const items = supportedCountervalues
  .map(cur => ({ value: cur.ticker, label: `${cur.name} (${cur.ticker})` }))
  .sort((a, b) => a.label.localeCompare(b.label));

const mapStateToProps = (state: State) => ({
  selectedKey: counterValueCurrencySelector(state).ticker,
  items,
});

const mapDispatchToProps = {
  onValueChange: ({ value }: *) => setCountervalue(value),
};

const Screen = makeGenericSelectScreen({
  id: "CounterValueSettingsSelect",
  itemEventProperties: item => ({ countervalue: item.value }),
  keyExtractor: item => item.value,
  formatItem: item => item.label,
});

// $FlowFixMe
export default connect(mapStateToProps, mapDispatchToProps)(Screen);
