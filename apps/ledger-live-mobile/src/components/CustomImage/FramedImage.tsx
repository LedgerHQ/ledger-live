import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { space } from "@ledgerhq/native-ui/styles/theme";
import React, { ComponentProps, useContext } from "react";
import { Image, StyleSheet } from "react-native";
import styled from "styled-components/native";
import { targetDimensions } from "../../screens/CustomImage/shared";
import ForceTheme from "../theme/ForceTheme";
import { scaleDimensions } from "./imageUtils";

type Props = Partial<ComponentProps<typeof Image>> & {
  /** source of the image inside */
  source?: ComponentProps<typeof Image>["source"];
  /** source of the background image */
  backgroundSource?: ComponentProps<typeof Image>["source"];
  /** text to display in the background placeholder */
  backgroundPlaceholderText?: string;
  /** float between 0 and 1 */
  loadingProgress?: number;
  children?: React.ReactNode | undefined;
};

const imageDimensions = scaleDimensions(targetDimensions, 0.4);

const px = 3;
const py = 3;

const Container = styled(Box).attrs({
  px,
  py,
})``;

const AbsoluteBackgroundContainer = styled(Flex).attrs({
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "lightgreen",
})``;

const BackgroundPlaceholder = styled(Flex).attrs({
  ...StyleSheet.absoluteFillObject,
  background: "#494949",
  px,
  py,
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
})``;

const AbsoluteInnerImageContainer = styled(Flex).attrs({
  ...StyleSheet.absoluteFillObject,
  mx: px,
  my: py,
  overflow: "hidden",
})``;

const FramedImage: React.FC<Props> = ({
  source,
  backgroundSource,
  backgroundPlaceholderText,
  loadingProgress = 1,
  children,
  ...imageProps
}) => {
  return (
    <Container>
      <ForceTheme selectedPalette="light">
        <AbsoluteBackgroundContainer>
          {backgroundSource ? (
            <Image
              source={backgroundSource}
              fadeDuration={0}
              resizeMode="contain"
              style={{
                height: imageDimensions.height + 2 * space[3],
                width: imageDimensions.width + 2 * space[3],
              }}
            />
          ) : (
            <BackgroundPlaceholder>
              <Text color="neutral.c00" textAlign="center">
                {backgroundPlaceholderText || "illustrationPlaceholder"}
              </Text>
            </BackgroundPlaceholder>
          )}
        </AbsoluteBackgroundContainer>
        <AbsoluteInnerImageContainer
          style={{ height: loadingProgress * imageDimensions.height }}
        >
          {source ? (
            <Image
              {...imageProps}
              fadeDuration={0}
              resizeMode="contain"
              source={source}
              style={imageDimensions}
            />
          ) : null}
        </AbsoluteInnerImageContainer>
        <Flex style={imageDimensions}>{children}</Flex>
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
