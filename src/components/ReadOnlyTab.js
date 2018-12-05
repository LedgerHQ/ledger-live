/* @flow */
import React, { Component } from "react";
import connect from "react-redux/es/connect/connect";
import { readOnlyModeEnabledSelector } from "../reducers/settings";
import TabIcon from "./TabIcon";

const mapStateToProps = state => ({
  readOnlyModeEnabled: readOnlyModeEnabledSelector(state),
});

class ReadOnlyTab extends Component<
  {
    oni18nKey: string,
    onIcon: *,
    offi18nKey: string,
    offIcon: *,
    tintColor: string,
    focused: boolean,
    readOnlyModeEnabled: boolean,
  },
  *,
> {
  render() {
    const {
      readOnlyModeEnabled,
      onIcon,
      focused,
      tintColor,
      offIcon,
      oni18nKey,
      offi18nKey,
      ...extraProps
    } = this.props;

    const icon = readOnlyModeEnabled ? onIcon : offIcon;
    const i18nKey = readOnlyModeEnabled ? oni18nKey : offi18nKey;

    return (
      <TabIcon
        focused={focused}
        tintColor={tintColor}
        Icon={icon}
        i18nKey={i18nKey}
        {...extraProps}
      />
    );
  }
}

export default connect(
  mapStateToProps,
  null,
)(ReadOnlyTab);
