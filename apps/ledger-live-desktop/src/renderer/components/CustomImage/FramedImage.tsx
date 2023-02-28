import React from "react";
import { Flex, Box } from "@ledgerhq/react-ui";
import styled from "styled-components";
import StyleProviderV3 from "~/renderer/styles/StyleProviderV3";
import transferBackground from "./assets/transferBackground.png";

type Props = Partial<React.ComponentProps<"img">> & {
  /** source of the image inside */
  source?: string;
  /** item to put in the background */
  background?: React.ReactNode | undefined;
  /** float between 0 and 1 */
  loadingProgress?: number;
  children?: React.ReactNode | undefined;
  frameConfig?: FrameConfig;
  scale?: number;
};

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

type FrameConfig = {
  frameHeight: number;
  frameWidth: number;
  innerWidth: number;
  innerHeight: number;
  innerRight: number;
  innerLeft: number;
  innerTop: number;
  innerBottomHeight: number;
  borderRightRadius: number;
  /** source of the background image */
  backgroundSource?: string;
};

const DEBUG = false;
export const transferConfigBase: FrameConfig = {
  frameHeight: 236,
  frameWidth: 150,
  innerHeight: 223,
  innerWidth: 140.5,
  innerRight: 8,
  innerTop: 7,
  innerLeft: 1.5,
  innerBottomHeight: 27,
  borderRightRadius: 6.5,
};

export const transferConfig: FrameConfig = {
  ...transferConfigBase,
  backgroundSource: transferBackground,
};

function scaleFrameConfig(frameConfig: FrameConfig, scale: number): FrameConfig {
  const { backgroundSource, ...rest } = frameConfig;
  return {
    backgroundSource,
    ...Object.fromEntries(
      Object.entries(rest).map(([key, value]) => {
        return [key, value * scale];
      }),
    ),
  } as FrameConfig;
}

const FramedImage: React.FC<Props> = ({
  source,
  loadingProgress = 1,
  children,
  frameConfig = transferConfig,
  scale,
  background,
  ...imageProps
}) => {
  const isLottie = !!background;

  const {
    frameHeight,
    frameWidth,
    innerWidth,
    innerHeight,
    innerRight,
    innerTop,
    innerLeft,
    borderRightRadius,
    innerBottomHeight,
    backgroundSource,
  } = scaleFrameConfig(frameConfig, scale || 1);

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
                }}
              />
            ) : null}
          </AbsoluteInnerImageContainer>
          <Flex style={{ height: innerHeight, width: innerWidth }}>{children}</Flex>
        </StyleProviderV3>
      </Container>
    </>
  );
};

export default FramedImage;
