/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { Switch } from "react-native";
import { createStructuredSelector } from "reselect";
import SettingsRow from "../../../components/SettingsRow";
import { setDeveloperMode } from "../../../actions/settings";
import { developerModeEnabledSelector } from "../../../reducers/settings";
import Track from "../../../analytics/Track";

type Props = {
  developerModeEnabled: boolean,
  setDeveloperMode: boolean => void,
};
const mapStateToProps = createStructuredSelector({
  developerModeEnabled: developerModeEnabledSelector,
});

const mapDispatchToProps = {
  setDeveloperMode,
};

class DeveloperModeRow extends PureComponent<Props> {
  render() {
    const { developerModeEnabled, setDeveloperMode, ...props } = this.props;
    return (
      <SettingsRow
        title={<Trans i18nKey="settings.display.developerMode" />}
        desc={<Trans i18nKey="settings.display.developerModeDesc" />}
        onPress={null}
        alignedTop
        {...props}
      >
        <Track
          event={developerModeEnabled ? "EnableDevMode" : "DisableDevMode"}
          onUpdate
        />
        <Switch value={developerModeEnabled} onValueChange={setDeveloperMode} />
      </SettingsRow>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DeveloperModeRow);
