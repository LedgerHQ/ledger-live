/* @flow */
import { connect } from "react-redux";
import { listFiatCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { setCountervalue } from "../../../actions/settings";
import { counterValueCurrencySelector } from "../../../reducers/settings";
import type { State } from "../../../reducers";
import makeGenericSelectScreen from "../../makeGenericSelectScreen";

const items = listFiatCurrencies()
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
  title: "Countervalue",
  keyExtractor: item => item.value,
  formatItem: item => item.label,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Screen);
