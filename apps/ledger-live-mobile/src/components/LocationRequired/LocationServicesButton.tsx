import React, { PureComponent } from "react";
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";
import { Trans } from "react-i18next";
import SettingsIcon from "../../icons/SettingsIcon";
import Button from "../../components/Button";

export default class LocationServicesButton extends PureComponent<{
  onRetry: () => void;
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
        event="LocationServiceOpenSettings"
        type="primary"
        title={<Trans i18nKey="location.open" />}
        onPress={this.openLocationServicesSetting}
        IconLeft={SettingsIcon}
      />
    );
  }
}
