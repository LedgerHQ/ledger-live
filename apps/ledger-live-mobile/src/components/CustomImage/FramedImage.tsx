import { Box, Flex } from "@ledgerhq/native-ui";
import React, { ComponentProps, useContext } from "react";
import { Image, ImageProps, StyleSheet } from "react-native";
import styled from "styled-components/native";
import ForceTheme from "../theme/ForceTheme";
import transferBackground from "./assets/transferBackground.png";
import previewBackground from "./assets/previewBackground.png";

/**
 * Set this to true to have visual indicators of how the foreground image (the content)
 * and the background image (the frame) will be positioned.
 * */
const DEBUG = false;

type FrameConfig = {
  frameHeight: number;
  frameWidth: number;
  innerWidth: number;
  innerHeight: number;
  innerRight: number;
  innerTop: number;
  borderRightRadius: number;
  /** source of the background image */
  backgroundSource?: ComponentProps<typeof Image>["source"];
  resizeMode: ImageProps["resizeMode"];
};

export type Props = Partial<ComponentProps<typeof Image>> & {
  /** source of the image inside */
  source?: ComponentProps<typeof Image>["source"];
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
  resizeMode: "cover",
};

export const transferConfig: FrameConfig = {
  ...transferConfigBase,
  backgroundSource: transferBackground,
};

export const transferLottieConfig: FrameConfig = {
  ...transferConfigBase,
  innerTop: 4.5,
  backgroundSource: transferBackground,
};

export const previewConfig: FrameConfig = {
  frameHeight: 320.62,
  frameWidth: 202.5,
  innerWidth: 180,
  innerHeight: 302.4,
  innerRight: 8.96,
  innerTop: 9.2,
  borderRightRadius: 14.4,
  backgroundSource: previewBackground,
  resizeMode: "cover",
};

function scaleFrameConfig(
  frameConfig: FrameConfig,
  scale: number,
): FrameConfig {
  const { backgroundSource, resizeMode, ...rest } = frameConfig;
  return {
    backgroundSource,
    resizeMode,
    ...Object.fromEntries(
      Object.entries(rest).map(([key, value]) => {
        return [key, value * scale];
      }),
    ),
  } as FrameConfig;
}

const Container = styled(Box).attrs({})``;

const AbsoluteBackgroundContainer = styled(Flex).attrs({
  ...StyleSheet.absoluteFillObject,
  backgroundColor: DEBUG ? "blue" : undefined,
})``;

const AbsoluteInnerImageContainer = styled(Flex).attrs({
  position: "absolute",
  overflow: "hidden",
  flexDirection: "row-reverse",
  justifyContent: "flex-start",
})``;

const FramedImage: React.FC<Props> = ({
  source,
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
    backgroundSource,
    resizeMode,
  } = scaleFrameConfig(frameConfig, scale || 1);
  return (
    <Container height={frameHeight} width={frameWidth}>
      <ForceTheme selectedPalette="light">
        <AbsoluteBackgroundContainer height={frameHeight} width={frameWidth}>
          {backgroundSource ? (
            <Image
              source={backgroundSource}
              fadeDuration={0}
              resizeMode="contain"
              style={{
                height: frameHeight,
                width: frameWidth,
              }}
            />
          ) : null}
        </AbsoluteBackgroundContainer>
        {background ? (
          <Flex
            {...StyleSheet.absoluteFillObject}
            height={frameHeight}
            justifyContent="center"
            width={frameWidth}
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
          {!DEBUG && source ? (
            <Image
              {...imageProps}
              fadeDuration={0}
              resizeMode={resizeMode}
              source={source}
              style={{
                height: innerHeight,
                width: innerWidth,
                borderTopRightRadius: borderRightRadius,
                borderBottomRightRadius: borderRightRadius,
              }}
            />
          ) : null}
        </AbsoluteInnerImageContainer>
        <Flex style={{ height: innerHeight, width: innerWidth }}>
          {children}
        </Flex>
      </ForceTheme>
    </Container>
  );
};

export default FramedImage;

type SourceContext = {
  source?: React.ComponentProps<typeof Image>["source"];
};

const initialState = {
  source: undefined,
};

export const ImageSourceContext =
  React.createContext<SourceContext>(initialState);

export const FramedImageWithContext: React.FC<
  Omit<Props, "source">
> = props => {
  const { source } = useContext(ImageSourceContext);
  return <FramedImage {...props} source={source} />;
};
