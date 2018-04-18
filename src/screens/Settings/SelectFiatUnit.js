/* @flow */
import { connect } from "react-redux";
import { listFiats } from "@ledgerhq/currencies";
import { saveSettings } from "../../actions/settings";
import type { State } from "../../reducers";
import makeGenericSelectScreen from "../makeGenericSelectScreen";
import { withCounterValuePolling } from "../../context/CounterValuePolling";

const mapStateToProps = (state: State) => ({
  value: state.settings.counterValue
});

const mapDispatchToProps = (dispatch: *, props: *) => ({
  onValueChange: (counterValue: string) => {
    dispatch(saveSettings({ counterValue }));
    props.counterValuePolling.poll();
    props.counterValuePolling.flush();
  }
});

const Screen = makeGenericSelectScreen({
  title: "Countervalue currency",
  items: listFiats()
    .map(cur => ({ value: cur.code, label: `${cur.name} (${cur.code})` }))
    .sort((a, b) => a.label.localeCompare(b.label))
});

export default withCounterValuePolling(
  connect(mapStateToProps, mapDispatchToProps)(Screen)
);
