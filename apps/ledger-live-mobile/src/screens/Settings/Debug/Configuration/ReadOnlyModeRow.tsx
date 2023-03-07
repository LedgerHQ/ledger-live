import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import SettingsRow from "../../../../components/SettingsRow";
import { setReadOnlyMode } from "../../../../actions/settings";
import { readOnlyModeEnabledSelector } from "../../../../reducers/settings";
import Track from "../../../../analytics/Track";
import { withReboot } from "../../../../context/Reboot";
import Switch from "../../../../components/Switch";
import type { State } from "../../../../reducers/types";

type Props = {
  readOnlyModeEnabled: boolean;
  setReadOnlyMode: (_: boolean) => void;
  reboot: (_?: boolean | null) => void;
};
const mapStateToProps = createStructuredSelector<
  State,
  { readOnlyModeEnabled: boolean }
>({
  readOnlyModeEnabled: readOnlyModeEnabledSelector,
});
const mapDispatchToProps = {
  setReadOnlyMode,
};

class ReadOnlyModeRow extends PureComponent<Props> {
  setReadOnlyModeAndReset = async (enabled: boolean) => {
    const { setReadOnlyMode, reboot } = this.props;
    await setReadOnlyMode(enabled);
    reboot();
  };

  render() {
    const { readOnlyModeEnabled, ...props } = this.props;
    return (
      <SettingsRow
        {...props}
        event="ReadOnlyModeRow"
        title="ReadOnly mode"
        desc="Readonly mode for testing, relaunch to refresh topbar"
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

const m = connect(
  mapStateToProps,
  mapDispatchToProps,
)(withReboot(ReadOnlyModeRow));
export default m;
