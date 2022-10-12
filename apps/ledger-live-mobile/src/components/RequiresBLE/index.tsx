// renders children if BLE is available
// otherwise render an error
import React, { Component } from "react";
import { Observable } from "rxjs";
import TransportBLE from "../../react-native-hw-transport-ble";
// eslint-disable-next-line import/no-unresolved
import RequiresLocationOnAndroid from "./RequiresLocationOnAndroid";
import BluetoothDisabled from "./BluetoothDisabled";

type Props = {
  children: any;
};
type State = {
  type: any;
};

class RequiresBLE extends Component<Props, State> {
  state = {
    type: "Unknown",
  };
  sub: any;

  componentDidMount() {
    this.sub = Observable.create(TransportBLE.observeState).subscribe({
      next: ({ type }) =>
        this.setState({
          type,
        }),
    });
  }

  componentWillUnmount() {
    this.sub.unsubscribe();
  }

  render() {
    const { children } = this.props;
    const { type } = this.state;
    if (type === "Unknown") return null; // suspense PLZ

    if (type === "PoweredOn") {
      return children;
    }

    return <BluetoothDisabled />;
  }
}

export default function RequiresBLEWrapped({ children }: any) {
  return (
    <RequiresLocationOnAndroid>
      <RequiresBLE>{children}</RequiresBLE>
    </RequiresLocationOnAndroid>
  );
}
