import React from "react";
import { Button, Flex, Text } from "@ledgerhq/react-ui";
import { CloseMedium } from "@ledgerhq/react-ui/assets/icons";

import nanoX from "~/renderer/images/nanoX.v3.svg";
import nanoXDark from "~/renderer/images/nanoXDark.v3.svg";
import Illustration from "~/renderer/components/Illustration";

const SyncOnboardingManual = () => {
  return (
    <Flex bg="background.main" width="100%" height="100%" flexDirection="column">
      <Flex width="100%" justifyContent="flex-end" mt={4} px={4}>
        <Button>English</Button>
        <Button ml={4} Icon={CloseMedium} />
      </Flex>
      <Flex flex={1} px={8} py={4}>
        <Flex flex={1}>
          <Text variant="h1" fontSize="24px">
            Setup your Nano
          </Text>
        </Flex>
        <Flex flex={1} justifyContent="center" alignItems="center">
          <Illustration
            style={{
              height: 540,
              width: 240,
              backgroundSize: "contain",
            }}
            lightSource={nanoX}
            darkSource={nanoXDark}
          />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SyncOnboardingManual;
