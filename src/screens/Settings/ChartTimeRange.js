/* @flow */
import { connect } from "react-redux";
import { saveSettings } from "../../actions/settings";
import type { State } from "../../reducers";
import makeGenericSelectScreen from "../makeGenericSelectScreen";

export const rangeList = [
  { value: 7, label: "1 week" },
  { value: 14, label: "2 weeks" },
  { value: 30, label: "1 month" },
  { value: 60, label: "2 months" },
  { value: 90, label: "3 months" },
  { value: 120, label: "4 months" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" }
];

export const formatChartTimeRange = (value: number) => {
  const obj = rangeList.find(o => o.value === value);
  return obj ? obj.label : `${value} days`;
};

const mapStateToProps = (state: State) => ({
  value: state.settings.chartTimeRange
});

const mapDispatchToProps = {
  onValueChange: chartTimeRange => saveSettings({ chartTimeRange })
};

const Screen = makeGenericSelectScreen({
  title: "Dashboard chart time range",
  items: rangeList
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
