/* @flow */
import { connect } from "react-redux";
import { listFiats } from "@ledgerhq/currencies";
import { saveSettings } from "../../actions/settings";
import type { State } from "../../reducers";
import makeGenericSelectScreen from "../makeGenericSelectScreen";
import { withCounterValuePolling } from "../../context/CounterValuePolling";

const items = listFiats()
  .map(cur => ({ value: cur.code, label: `${cur.name} (${cur.code})` }))
  .sort((a, b) => a.label.localeCompare(b.label));

const mapStateToProps = (state: State) => ({
  selectedKey: state.settings.counterValue,
  items
});

const mapDispatchToProps = (dispatch: *, props: *) => ({
  onValueChange: ({ value }: *) => {
    dispatch(saveSettings({ counterValue: value }));
    props.counterValuePolling.poll();
    props.counterValuePolling.flush();
  }
});

const Screen = makeGenericSelectScreen({
  title: "Countervalue currency",
  keyExtractor: item => item.value,
  formatItem: item => item.label
});

export default withCounterValuePolling(
  connect(mapStateToProps, mapDispatchToProps)(Screen)
);
