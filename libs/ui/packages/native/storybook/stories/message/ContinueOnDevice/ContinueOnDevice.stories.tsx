import React from "react";
import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../../storiesOf";
import { ContinueOnDevice, Flex } from "../../../../src/";

const ContinueOnDeviceSample = () => {
  return (
    <Flex flex={1} alignSelf="center" justifyContent="center" p={6} alignItems="center">
      <ContinueOnDevice
        Icon={({ size }) => (
          <Flex height={size} width={size} borderRadius={size} bg="neutral.c40" />
        )}
        text={text("children text", "Continue on Nano")}
      />
    </Flex>
  );
};

storiesOf((story) => story("Messages", module).add("ContinueOnDevice", ContinueOnDeviceSample));
