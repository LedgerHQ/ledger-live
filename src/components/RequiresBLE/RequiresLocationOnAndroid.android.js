// @flow
// renders children if Location is available
// otherwise render an error

import React, { Component } from "react";
import { PermissionsAndroid } from "react-native";
import LocationRequired from "../../screens/LocationRequired";

const permission = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

// FIXME this only detect the permission. not if location is enabled at runtime –_–

export default class RequiresBLE extends Component<
  {
    children: *,
  },
  {
    state: *,
  },
> {
  state = {
    state: null,
  };

  componentDidMount() {
    this.request();
  }

  request = async () => {
    this.setState({
      state: await PermissionsAndroid.request(permission, {
        title: "Location is required for Bluetooth BLE",
        message:
          "on Android, Location permission is required to being able to list Bluetooth BLE devices.",
      }),
    });
  };

  render() {
    const { children } = this.props;
    const { state } = this.state;
    if (!state) return null; // suspense PLZ
    if (state === PermissionsAndroid.RESULTS.GRANTED) {
      return children;
    }
    return <LocationRequired />;
  }
}
