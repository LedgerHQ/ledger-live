// renders children if Location is available
// otherwise render an error
import React, { Component } from "react";
import { PermissionsAndroid } from "react-native";
import LocationRequired from "../../screens/LocationRequired";

const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

class RequiresBLE extends Component<
  {
    children: any;
  },
  {
    state: {
      granted: boolean | null | undefined;
    };
  }
> {
  state = {
    granted: null,
  };

  componentDidMount() {
    this.request();
  }

  request = async () => {
    const result = await PermissionsAndroid.request(permission);
    this.setState({
      granted: result === PermissionsAndroid.RESULTS.GRANTED,
    });
  };
  retry = async () => {
    const granted = await PermissionsAndroid.check(permission);
    this.setState({
      granted,
    });
  };

  render() {
    const { children } = this.props;
    const { granted } = this.state;
    if (granted === null) return null; // suspense PLZ

    if (granted === true) return children;
    return <LocationRequired errorType="unauthorized" onRetry={this.retry} />;
  }
}

export default RequiresBLE;
