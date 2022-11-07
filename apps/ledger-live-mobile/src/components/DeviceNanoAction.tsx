import React, { PureComponent } from "react";
import DeviceNanoXAction from "./DeviceNanoXAction";
import DeviceNanoSAction from "./DeviceNanoSAction";

export type PropsExceptModelId = {
  wired?: boolean;
  action?: "left" | "accept";
  screen?: "validation" | "home" | "pin" | "empty";
  width: number;
  error?: Error;
};
export type Props = PropsExceptModelId & {
  modelId?: "nanoS" | "nanoX" | "blue";
};

class DeviceNanoAction extends PureComponent<Props> {
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
