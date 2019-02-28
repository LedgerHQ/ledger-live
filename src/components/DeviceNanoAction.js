// @flow
import React, { PureComponent } from "react";
import DeviceNanoXAction from "./DeviceNanoXAction";
import DeviceNanoSAction from "./DeviceNanoSAction";

class DeviceNanoAction extends PureComponent<{
  connected?: boolean,
  action?: "left" | "both" | "right",
  screen?: "validation" | "home" | "pin" | "empty",
  width: number,
  error?: Error,
  modelId?: "nanoS" | "nanoX",
}> {
  static defaultProps = {
    width: 272,
    modelId: "nanoX",
  };

  render() {
    const { modelId, ...rest } = this.props;

    return modelId === "nanoX" ? (
      <DeviceNanoXAction {...rest} />
    ) : (
      <DeviceNanoSAction {...rest} />
    );
  }
}

export default DeviceNanoAction;
