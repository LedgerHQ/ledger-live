/* @flow */
import { connect } from "react-redux";
import { saveSettings } from "../../actions/settings";
import type { State } from "../../reducers";
import makeGenericSelectScreen from "../makeGenericSelectScreen";

type Item = { label: string, value: number };

export const rangeList: Item[] = [
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
  selectedKey: String(state.settings.chartTimeRange),
  items: rangeList
});

const mapDispatchToProps = {
  onValueChange: ({ value }: Item) => saveSettings({ chartTimeRange: value })
};

const Screen = makeGenericSelectScreen({
  title: "Dashboard chart time range",
  keyExtractor: (item: Item) => String(item.value),
  formatItem: (item: Item) => item.label
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
