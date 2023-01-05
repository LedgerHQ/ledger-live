import React from "react";
import { Flex, Box } from "@ledgerhq/react-ui";
import styled from "styled-components";

import StyleProviderV3 from "~/renderer/styles/StyleProviderV3";
import transferBackground from "./assets/transferBackground.png";
import previewBackground from "./assets/previewBackground.png";

const DEBUG = false;

type FrameConfig = {
  frameHeight: number;
  frameWidth: number;
  innerWidth: number;
  innerHeight: number;
  innerRight: number;
  innerTop: number;
  borderRightRadius: number;
  backgroundSrc?: React.ComponentProps<"img">["src"];
  objectFit?: React.CSSProperties["objectFit"];
};

export type Props = Partial<React.ComponentProps<"img">> & {
  /** source of the image inside */
  src?: React.ComponentProps<"img">["src"];
  /** item to put in the background */
  background?: React.ReactNode | undefined;
  /** float between 0 and 1 */
  loadingProgress?: number;
  children?: React.ReactNode | undefined;
  frameConfig: FrameConfig;
  scale?: number;
};

export const transferConfigBase: FrameConfig = {
  frameHeight: 222,
  frameWidth: 141,
  innerHeight: 210,
  innerWidth: 133,
  innerRight: 8,
  innerTop: 6,
  borderRightRadius: 5,
  objectFit: "cover",
};

export const transferConfig: FrameConfig = {
  ...transferConfigBase,
  backgroundSrc: transferBackground,
};

export const transferLottieConfig: FrameConfig = {
  ...transferConfigBase,
  innerTop: 4.5,
  backgroundSrc: transferBackground,
};

export const previewConfig: FrameConfig = {
  frameHeight: 320.62,
  frameWidth: 202.5,
  innerWidth: 180,
  innerHeight: 302.4,
  innerRight: 8.96,
  innerTop: 9.2,
  borderRightRadius: 14.4,
  backgroundSrc: previewBackground,
  objectFit: "cover",
};

function scaleFrameConfig(frameConfig: FrameConfig, scale: number): FrameConfig {
  const { backgroundSrc, objectFit, ...rest } = frameConfig;
  return {
    backgroundSrc,
    objectFit,
    ...Object.fromEntries(
      Object.entries(rest).map(([key, value]) => {
        return [key, value * scale];
      }),
    ),
  } as FrameConfig;
}

const absoluteFillObject = {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
} as const;

const Container = styled(Box).attrs({
  position: "relative",
})``;

const AbsoluteBackgroundContainer = styled(Flex).attrs({
  ...absoluteFillObject,
  backgroundColor: DEBUG ? "blue" : undefined,
})``;

const AbsoluteInnerImageContainer = styled(Flex).attrs({
  position: "absolute",
  overflow: "hidden",
  flexDirection: "row-reverse",
  justifyContent: "flex-start",
})``;

const FramedImage: React.FC<Props> = ({
  src,
  loadingProgress = 1,
  children,
  frameConfig = transferConfig,
  scale,
  background,
  ...imageProps
}) => {
  const {
    frameHeight,
    frameWidth,
    innerWidth,
    innerHeight,
    innerRight,
    innerTop,
    borderRightRadius,
    backgroundSrc,
    objectFit,
  } = scaleFrameConfig(frameConfig, scale || 1);

  return (
    <StyleProviderV3 selectedPalette="light">
      <Container height={frameHeight} width={frameWidth}>
        <AbsoluteBackgroundContainer height={frameHeight} width={frameWidth}>
          {backgroundSrc ? (
            <img
              src={backgroundSrc}
              style={{
                height: frameHeight,
                width: frameWidth,
              }}
            />
          ) : null}
        </AbsoluteBackgroundContainer>
        {background ? (
          <Flex
            {...absoluteFillObject}
            height={frameHeight}
            width={frameWidth}
            justifyContent="center"
          >
            {background}
          </Flex>
        ) : null}
        <AbsoluteInnerImageContainer
          style={{
            right: innerRight,
            top: innerTop,
            height: loadingProgress * innerHeight,
            width: innerWidth,
            backgroundColor: DEBUG ? "red" : undefined,
          }}
        >
          {!DEBUG && src ? (
            <img
              {...imageProps}
              src={src}
              style={{
                ...(imageProps.style || {}),
                objectFit,
                height: innerHeight,
                width: innerWidth,
                borderTopRightRadius: borderRightRadius,
                borderBottomRightRadius: borderRightRadius,
                pointerEvents: "none",
              }}
            />
          ) : null}
        </AbsoluteInnerImageContainer>
        <Flex
          style={{
            height: innerHeight,
            width: innerWidth,
          }}
        >
          {children}
        </Flex>
      </Container>
    </StyleProviderV3>
  );
};

export default FramedImage;
