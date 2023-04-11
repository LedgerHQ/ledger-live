import React from "react";
import { ContinueOnDevice, Flex } from "../../../../src/components";

export default {
  title: "Messages/ContinueOnDevice",
  component: ContinueOnDevice,
};

export const ContinueOnDeviceSample = (args: typeof ContinueOnDeviceSampleArgs) => {
  return (
    <Flex flex={1} alignSelf="center" justifyContent="center" p={6} alignItems="center">
      <ContinueOnDevice
        Icon={({ size }) => (
          <Flex height={size} width={size} borderRadius={size} bg="neutral.c40" />
        )}
        text={args.childrenText}
      />
    </Flex>
  );
};
ContinueOnDeviceSample.storyName = "ContinueOnDevice";
const ContinueOnDeviceSampleArgs = {
  childrenText: "Continue on Nano",
};
ContinueOnDeviceSample.args = ContinueOnDeviceSampleArgs;
