/* @flow */
import React, { PureComponent, Fragment } from "react";
import { connect } from "react-redux";
import { Switch } from "react-native";
import { createStructuredSelector } from "reselect";
import SettingsRow from "../../../components/SettingsRow";
import { setExperimentalUSBSupport } from "../../../actions/settings";
import { experimentalUSBEnabledSelector } from "../../../reducers/settings";

type Props = {
  experimentalUSBEnabled: boolean,
  setExperimentalUSBSupport: boolean => void,
};

type State = {
  isActive: boolean,
};

const mapStateToProps = createStructuredSelector({
  experimentalUSBEnabled: experimentalUSBEnabledSelector,
});

const mapDispatchToProps = {
  setExperimentalUSBSupport,
};

class ConfigUSBDeviceSupport extends PureComponent<Props, State> {
  render() {
    const { experimentalUSBEnabled, setExperimentalUSBSupport } = this.props;
    return (
      <Fragment>
        <SettingsRow
          title="Enable Experimental USB Support"
          onPress={null}
          alignedTop
        >
          <Switch
            value={experimentalUSBEnabled}
            onValueChange={setExperimentalUSBSupport}
          />
        </SettingsRow>
      </Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConfigUSBDeviceSupport);
