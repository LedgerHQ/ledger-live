import React from "react";
import Lottie from "react-lottie";
import { getEnv } from "@shared/live-env";
import { Flex } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useTheme } from "styled-components";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import Europa from "../../assets/europa-success.png";

const confettiLayerStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
};

export default function EuropaCompletionView() {
  const { theme } = useTheme();
  const animation = getDeviceAnimation(DeviceModelId.europa, theme, "onboardingSuccess");
  const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");

  return (
    <Flex height="100vh" width="100vw" data-testid="europa-completion-view">
      <Flex style={confettiLayerStyle}>
        {animation ? (
          <Lottie
            style={{ width: "100%", height: "100%" }}
            isClickToPauseDisabled
            ariaRole="presentation"
            options={{
              loop: true,
              autoplay: !isPlaywright,
              animationData: animation,
              rendererSettings: {
                preserveAspectRatio: "xMidYMid slice",
              },
            }}
          />
        ) : null}
      </Flex>
      <Flex alignItems="center" justifyContent="center" style={{ zIndex: 1 }} flex={1}>
        <img src={Europa} alt="Europa" />
      </Flex>
    </Flex>
  );
}
