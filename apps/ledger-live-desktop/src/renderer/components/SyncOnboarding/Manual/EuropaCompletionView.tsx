import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import React from "react";
import styled, { useTheme } from "styled-components";
import { Flex } from "@ledgerhq/react-ui";
import { Device } from "@ledgerhq/types-devices";
import Europa from "./assets/europa-success.png";

type Props = {
  device: Device;
};

const Container = styled(Flex)`
  position: relative;
`;

const StyledAnimation = styled(Animation)`
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const EuropaCompletionView: React.FC<Props> = ({ device }) => {
  const { colors } = useTheme();
  const palette = colors.palette.type;

  return (
    <Container height="100vh" width="100vw">
      <StyledAnimation
        animation={getDeviceAnimation(device.modelId, palette, "onboardingSuccess")}
        height="100vh"
        width="100vw"
      />
      <Flex alignItems="center" justifyContent="center" style={{ zIndex: 1 }} flex={1}>
        <img src={Europa} alt="Europa" />
      </Flex>
    </Container>
  );
};

export default EuropaCompletionView;
