/* @flow */
import { connect } from "react-redux";
import _ from "lodash";
import { setLocale } from "../../../actions/settings";
import { localeSelector } from "../../../reducers/settings";
import type { State } from "../../../reducers";
import makeGenericSelectScreen from "../../makeGenericSelectScreen";
import regionByKeys from "./regions.json";

const items = Object.keys(regionByKeys)
  .map(key => {
    const { languageDisplayName, regionDisplayName } = regionByKeys[key];
    const label = `${_.upperFirst(regionDisplayName)} (${_.upperFirst(
      languageDisplayName,
    )})`;
    return { value: key, label };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

const mapStateToProps = (state: State) => ({
  selectedKey: localeSelector(state),
  items,
});

const mapDispatchToProps = {
  onValueChange: ({ value }: *) => setLocale(value),
};

const Screen = makeGenericSelectScreen({
  id: "RegionSettingsSelect",
  itemEventProperties: item => ({ countervalue: item.value }),
  keyExtractor: item => item.value,
  formatItem: item => item.label,
});

// $FlowFixMe
export default connect(mapStateToProps, mapDispatchToProps)(Screen);
