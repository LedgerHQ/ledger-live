import React from "react";
import { ContinueOnDevice } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import ContinueOnStax from "./ContinueOnStax";
import ContinueOnEuropa from "./ContinueOnEuropa";

type Props = {
  deviceModelId: DeviceModelId;
  text: string;
  withTopDivider?: boolean;
};

const ContinueOnDeviceWithAnim: React.FC<Props> = ({
  text,
  withTopDivider,
  deviceModelId,
}: Props) => {
  // TODO: when lotties are available, use a different lottie for each deviceModelId, as Icon prop
  return (
    <ContinueOnDevice
      Icon={deviceModelId === DeviceModelId.stax ? ContinueOnStax : ContinueOnEuropa}
      text={text}
      withTopDivider={withTopDivider}
    />
  );
};

export default ContinueOnDeviceWithAnim;
