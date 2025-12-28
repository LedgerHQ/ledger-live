import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import React from "react";
import { useTheme } from "styled-components";
import { Flex } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import Europa from "../../assets/europa-success.png";

export default function EuropaCompletionView() {
  const { theme } = useTheme();

  return (
    <Flex height="100vh" width="100vw" data-testid="europa-completion-view">
      <Flex position="fixed">
        <Animation
          animation={getDeviceAnimation(DeviceModelId.europa, theme, "onboardingSuccess")}
          height="100vh"
          width="100vw"
        />
      </Flex>
      <Flex alignItems="center" justifyContent="center" style={{ zIndex: 1 }} flex={1}>
        <img src={Europa} alt="Europa" />
      </Flex>
    </Flex>
  );
}
