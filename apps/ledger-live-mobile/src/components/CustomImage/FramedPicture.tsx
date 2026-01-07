import { Box, Flex } from "@ledgerhq/native-ui";
import React, { ComponentProps, useContext, useMemo } from "react";
import { Image, StyleSheet } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import ForceTheme from "../theme/ForceTheme";
import { getFramedPictureConfig } from "./framedPictureConfigs";

/**
 * Set this to true to have visual indicators of how the foreground image (the content)
 * and the background image (the frame) will be positioned.
 * */
const DEBUG = false;

const DEFAULT_SCALE_COEFFICIENT = 0.8;

export type Props = Partial<ComponentProps<typeof Image>> & {
  /** device model id to get model specific configuration */
  deviceModelId: CLSSupportedDeviceModelId;
  /** source of the image inside */
  source?: ComponentProps<typeof Image>["source"];
  /** item to put in the background */
  background?: React.ReactNode | undefined;
  /** float between 0 and 1 */
  loadingProgress?: number;
  children?: React.ReactNode | undefined;
};

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

/**
 * This is used to display a picture representing Ledger Stax and on top of it
 * a picture that is "framed" (as if it's displayed on the Ledger Stax screen).
 */
const FramedPicture: React.FC<Props> = ({
  deviceModelId,
  source,
  loadingProgress = 1,
  children,
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
    borderLeftRadius,
    backgroundSource,
    resizeMode,
    leftPaddingColor,
    scaleCoefficient = DEFAULT_SCALE_COEFFICIENT,
  } = useMemo(() => getFramedPictureConfig(deviceModelId), [deviceModelId]);
  const { colors } = useTheme();

  return (
    <Box
      /**
       * trick to scale down both pictures together and avoid rounding errors
       * that are causing "long white 1px white lines" with the background
       * picture and the foreground picture getting misaligned by 1px
       */
      height={frameHeight * scaleCoefficient}
      width={frameWidth * scaleCoefficient}
      style={{
        transform: [
          { scale: scaleCoefficient },
          { translateX: (frameWidth * (scaleCoefficient - 1)) / 2 }, // centering the content after scaling
          { translateY: (frameHeight * (scaleCoefficient - 1)) / 2 },
        ],
      }}
    >
      <Box height={frameHeight} width={frameWidth}>
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
          {leftPaddingColor ? (
            <AbsoluteInnerImageContainer
              style={{
                right: innerRight + borderRightRadius,
                top: innerTop,
                left: 0,
                height: loadingProgress * innerHeight,
                backgroundColor: leftPaddingColor,
              }}
            />
          ) : null}
          <AbsoluteInnerImageContainer
            style={{
              width: innerWidth,
              height: innerHeight,
              top: innerTop,
              right: innerRight,
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
                  borderTopLeftRadius: borderLeftRadius,
                  borderBottomLeftRadius: borderLeftRadius,
                }}
              />
            ) : null}
          </AbsoluteInnerImageContainer>
          <Flex style={{ height: innerHeight, width: innerWidth }}>{children}</Flex>
        </ForceTheme>
      </Box>
    </Box>
  );
};

export default FramedPicture;

type SourceContext = {
  source?: React.ComponentProps<typeof Image>["source"];
};

const initialState = {
  source: undefined,
};

export const ImageSourceContext = React.createContext<SourceContext>(initialState);

export const FramedImageWithContext: React.FC<Omit<Props, "source">> = props => {
  const { source } = useContext(ImageSourceContext);
  return <FramedPicture {...props} source={source} />;
};
