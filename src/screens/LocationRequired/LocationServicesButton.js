// @flow

import React, { PureComponent } from "react";
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";
import SettingsIcon from "./assets/SettingsIcon";
import Button from "../../components/Button";

export default class LocationServicesButton extends PureComponent<{
  onRetry: Function,
}> {
  openLocationServicesSetting = () => {
    LocationServicesDialogBox.checkLocationServicesIsEnabled({
      enableHighAccuracy: false,
      showDialog: false,
      openLocationServices: true,
    })
      .then(this.props.onRetry)
      .catch(() => {
        // Nothing to do: location is still disabled
      });
  };

  render() {
    return (
      <Button
        type="primary"
        title="Open location settings"
        onPress={this.openLocationServicesSetting}
        iconLeft={SettingsIcon}
      />
    );
  }
}
