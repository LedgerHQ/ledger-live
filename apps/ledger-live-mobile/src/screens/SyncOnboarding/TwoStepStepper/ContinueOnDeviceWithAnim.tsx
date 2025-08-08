import React from "react";
import { ContinueOnDevice } from "@ledgerhq/native-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import ContinueOnStax from "../assets/ContinueOnStax";
import ContinueOnEuropa from "../assets/ContinueOnEuropa";

const ContinueOnDeviceWithAnim: React.FC<{
  deviceModelId: DeviceModelId;
  text: string;
  withTopDivider?: boolean;
}> = ({ text, withTopDivider, deviceModelId }) => {
  // TODO: when lotties are available, move this component to its own file and use a different lottie for each deviceModelId, as Icon prop
  return (
    <ContinueOnDevice
      Icon={deviceModelId === DeviceModelId.stax ? ContinueOnStax : ContinueOnEuropa}
      text={text}
      withTopDivider={withTopDivider}
    />
  );
};

export default ContinueOnDeviceWithAnim;
