import React from "react";
import { ContinueOnDevice } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import ContinueOnStax from "./ContinueOnStax";

type Props = {
  deviceModelId: DeviceModelId;
  text: string;
  withTopDivider?: boolean;
};

const ContinueOnDeviceWithAnim: React.FC<Props> = ({ text, withTopDivider }: Props) => {
  // TODO: when lotties are available, use a different lottie for each deviceModelId, as Icon prop
  return <ContinueOnDevice Icon={ContinueOnStax} text={text} withTopDivider={withTopDivider} />;
};

export default ContinueOnDeviceWithAnim;
