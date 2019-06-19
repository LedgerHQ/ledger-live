/* @flow */
import { connect } from "react-redux";
import { listFiatCurrencies } from "@ledgerhq/live-common/lib/currencies";
import i18next from "i18next";
import { setCountervalue } from "../../../actions/settings";
import {
  counterValueCurrencySelector,
  possibleIntermediaries,
} from "../../../reducers/settings";
import type { State } from "../../../reducers";
import makeGenericSelectScreen from "../../makeGenericSelectScreen";

const items = [...listFiatCurrencies(), ...possibleIntermediaries]
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
  title: i18next.t("settings.display.counterValue"),
  keyExtractor: item => item.value,
  formatItem: item => item.label,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Screen);
