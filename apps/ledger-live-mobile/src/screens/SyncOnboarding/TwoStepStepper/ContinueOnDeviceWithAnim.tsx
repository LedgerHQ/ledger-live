import React, { useMemo } from "react";
import { ContinueOnDevice } from "@ledgerhq/native-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import ContinueOnStax from "../assets/ContinueOnStax";
import ContinueOnEuropa from "../assets/ContinueOnEuropa";
import ContinueOnApex from "../assets/ContinueOnApex";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";

const ContinueOnDeviceWithAnim: React.FC<{
  deviceModelId: DeviceModelId;
  text: string;
  withTopDivider?: boolean;
}> = ({ text, withTopDivider, deviceModelId }) => {
  const DeviceIcon: IconType = useMemo(() => {
    switch (deviceModelId) {
      case DeviceModelId.stax:
        return ContinueOnStax;
      case DeviceModelId.europa:
        return ContinueOnEuropa;
      case DeviceModelId.apex:
        return ContinueOnApex; // Use the same icon as Europa for now
      default:
        return ContinueOnEuropa; // Fallback to Europa icon
    }
  }, [deviceModelId]);

  // TODO: when lotties are available, move this component to its own file and use a different lottie for each deviceModelId, as Icon prop
  return <ContinueOnDevice Icon={DeviceIcon} text={text} withTopDivider={withTopDivider} />;
};

export default ContinueOnDeviceWithAnim;
