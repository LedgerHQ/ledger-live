/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import SettingsRow from "../../../components/SettingsRow";
import { setReadOnlyMode } from "../../../actions/settings";
import { readOnlyModeEnabledSelector } from "../../../reducers/settings";
import Track from "../../../analytics/Track";
import { withReboot } from "../../../context/Reboot";
import Switch from "../../../components/Switch";

type Props = {
  readOnlyModeEnabled: boolean,
  setReadOnlyMode: boolean => void,
  reboot: (?boolean) => *,
};
const mapStateToProps = createStructuredSelector({
  readOnlyModeEnabled: readOnlyModeEnabledSelector,
});

const mapDispatchToProps = {
  setReadOnlyMode,
};

class DeveloperModeRow extends PureComponent<Props> {
  setReadOnlyModeAndReset = async (enabled: boolean) => {
    const { setReadOnlyMode, reboot } = this.props;
    await setReadOnlyMode(enabled);
    reboot();
  };

  render() {
    const { readOnlyModeEnabled, ...props } = this.props;
    return (
      <SettingsRow
        event="ReadOnlyModeRow"
        title="ReadOnly mode"
        desc="Toggle readonly mode for testing, relaunch to refresh topbar"
        onPress={null}
        alignedTop
        {...props}
      >
        <Track
          event={
            readOnlyModeEnabled ? "EnableReadOnlyMode" : "DisableReadOnlyMode"
          }
          onUpdate
        />
        <Switch
          value={readOnlyModeEnabled}
          onValueChange={this.setReadOnlyModeAndReset}
        />
      </SettingsRow>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withReboot(DeveloperModeRow));
