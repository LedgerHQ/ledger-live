/* @flow */
import { connect } from "react-redux";
import { setLocale } from "../../../actions/settings";
import { localeSelector } from "../../../reducers/settings";
import type { State } from "../../../reducers";
import makeGenericSelectScreen from "../../makeGenericSelectScreen";

export const regionByKeys = {
  // TODO: replace this by the full list of regions
  de: "Deutsch",
  el: "Ελληνικά",
  en: "English",
  es: "Español",
  fi: "suomi",
  fr: "Français",
  hu: "magyar",
  it: "italiano",
  ja: "日本語",
  ko: "한국어",
  nl: "Nederlands",
  no: "Norsk",
  pl: "polski",
  pt: "português",
  ru: "Русский",
  sr: "српски",
  sv: "svenska",
  tr: "Türkçe",
  zh: "简体中文",
};

const items = Object.keys(regionByKeys)
  .map(key => ({ value: key, label: regionByKeys[key] }))
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
