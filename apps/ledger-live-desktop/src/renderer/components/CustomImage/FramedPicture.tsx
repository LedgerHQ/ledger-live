import React from "react";
import { Flex, Box, Icons } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import StyleProviderV3 from "~/renderer/styles/StyleProviderV3";
import { getFramedPictureConfig, FramedPictureConfig } from "./framedPictureConfigs";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";

const absoluteFillObject = {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

const Container = styled(Box).attrs({
  position: "relative",
})``;

const AbsoluteBackgroundContainer = styled(Flex).attrs({
  ...absoluteFillObject,
})``;

const AbsoluteInnerImageContainer = styled(Flex).attrs({
  overflow: "hidden",
  position: "absolute",
  flexDirection: "row-reverse",
  justifyContent: "flex-start",
})``;

const DEBUG = false;

function scaleFrameConfig(frameConfig: FramedPictureConfig, scale: number): FramedPictureConfig {
  const { backgroundSource, ...rest } = frameConfig;
  return {
    backgroundSource,
    ...Object.fromEntries(
      Object.entries(rest).map(([key, value]) => {
        return [key, value * scale];
      }),
    ),
  } as FramedPictureConfig;
}

const DEFAULT_SCALE_COEFFICIENT = 0.65;
/* The height of the confirmation button, could vary per device model later */
const BUTTON_HEIGHT = 40;

type Props = Partial<React.ComponentProps<"img">> & {
  /** source of the image inside */
  source?: string;
  /** item to put in the background */
  background?: React.ReactNode | undefined;
  /** float between 0 and 1 */
  loadingProgress?: number;
  deviceModelId: CLSSupportedDeviceModelId;
  scaleCoefficient?: number;
  showConfirmationButton?: boolean;
};

const CheckButton = styled(Flex).attrs({
  width: "50%",
  height: "100%",
  backgroundColor: "neutral.c90",
  ml: "auto",
})``;

const FramedPicture: React.FC<Props> = ({
  source,
  loadingProgress = 1,
  deviceModelId,
  scaleCoefficient = DEFAULT_SCALE_COEFFICIENT,
  showConfirmationButton = false,
  background,
  ...imageProps
}) => {
  const { colors } = useTheme();
  const isLottie = !!background;
  const frameConfig = getFramedPictureConfig(deviceModelId);
  const {
    frameHeight,
    frameWidth,
    innerWidth,
    innerHeight,
    innerRight,
    innerTop,
    innerLeft,
    borderRightRadius,
    borderLeftRadius,
    innerBottomHeight,
    backgroundSource,
  } = scaleFrameConfig(frameConfig, scaleCoefficient || 1);

  return (
    <>
      <Container height={frameHeight} width={frameWidth}>
        <StyleProviderV3 selectedPalette="light">
          <AbsoluteBackgroundContainer height={frameHeight} width={frameWidth}>
            {!background && backgroundSource ? (
              <img
                src={backgroundSource}
                style={{
                  height: frameHeight,
                  width: frameWidth,
                  objectFit: "fill",
                }}
              />
            ) : null}
          </AbsoluteBackgroundContainer>
          <Flex height={frameHeight} justifyContent="center" width={frameWidth}>
            {background || null}
          </Flex>
          <AbsoluteInnerImageContainer
            style={{
              top: innerTop,
              left: innerLeft,
              width: innerWidth,
              height: innerHeight,
              borderTopRightRadius: borderRightRadius,
              borderBottomRightRadius: borderRightRadius,
              borderTopLeftRadius: borderLeftRadius,
              borderBottomLeftRadius: borderLeftRadius,
            }}
            backgroundColor={colors.neutral.c30}
          ></AbsoluteInnerImageContainer>
          <AbsoluteInnerImageContainer
            style={{
              right: innerRight,
              top: innerTop,
              left: innerLeft,
              height: loadingProgress * (innerHeight - (isLottie ? innerBottomHeight : 0)),
              width: innerWidth,
              backgroundColor: DEBUG ? "red" : undefined,
            }}
          >
            {!DEBUG && source ? (
              <img
                {...imageProps}
                src={source}
                style={{
                  height: innerHeight,
                  width: innerWidth,
                  objectFit: "fill",
                  borderTopRightRadius: borderRightRadius,
                  borderBottomRightRadius: borderRightRadius,
                  borderTopLeftRadius: borderLeftRadius,
                  borderBottomLeftRadius: borderLeftRadius,
                }}
              />
            ) : null}
          </AbsoluteInnerImageContainer>
          {showConfirmationButton ? (
            <Flex
              width={`${innerWidth}px`}
              height={`${BUTTON_HEIGHT}px`}
              ml={`${innerLeft}px`}
              mt={`-${innerBottomHeight + BUTTON_HEIGHT}px`}
              backgroundColor={"neutral.c20"}
              position={"relative"}
              overflow={"hidden"}
              borderBottomLeftRadius={borderLeftRadius}
              borderBottomRightRadius={borderRightRadius}
            >
              <CheckButton>
                <Icons.Check style={{ margin: "auto" }} color="constant.white" />
              </CheckButton>
            </Flex>
          ) : null}
        </StyleProviderV3>
      </Container>
    </>
  );
};

export default FramedPicture;
