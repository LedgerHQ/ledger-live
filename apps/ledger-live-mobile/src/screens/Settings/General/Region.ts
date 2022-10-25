import { connect } from "react-redux";
import upperFirst from "lodash/upperFirst";
import { setLocale } from "../../../actions/settings";
import { localeSelector } from "../../../reducers/settings";
import type { State } from "../../../reducers";
import makeGenericSelectScreen from "../../makeGenericSelectScreen";
import regionByKeys from "./regions.json";

const items = Object.keys(regionByKeys)
  .map(key => {
    const { languageDisplayName, regionDisplayName } = regionByKeys[key];
    const label = `${upperFirst(regionDisplayName)} (${upperFirst(
      languageDisplayName,
    )})`;
    return {
      value: key,
      label,
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

const mapStateToProps = (state: State) => {
  const selectedKey = localeSelector(state);
  return {
    selectedKey,
    initialSearchQuery:
      items.find(item => item.value === selectedKey)?.label ?? "",
    items,
  };
};

const mapDispatchToProps = {
  onValueChange: ({ value }: any) => setLocale(value),
};
const Screen = makeGenericSelectScreen({
  id: "RegionSettingsSelect",
  itemEventProperties: item => ({
    region: item.value?.split("-")[1] || item.value,
  }),
  keyExtractor: item => item.value,
  formatItem: item => item.label,
  searchable: true,
  searchKeys: ["label", "value"],
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
