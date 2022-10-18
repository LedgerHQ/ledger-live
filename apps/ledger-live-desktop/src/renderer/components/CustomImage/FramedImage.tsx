import React, { useContext } from "react";
import { Flex, Box, Text } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import { scaleDimensions } from "./imageUtils";
import { targetDimensions } from "./shared";
import StyleProviderV3 from "~/renderer/styles/StyleProviderV3";

type Props = Partial<React.ComponentProps<"img">> & {
  /** source of the image inside */
  src?: string | undefined;
  /** source of the background image */
  backgroundSrc?: string | undefined;
  /** text to display in the background placeholder */
  backgroundPlaceholderText?: string;
  /** float between 0 and 1 */
  loadingProgress?: number;
  children?: React.ReactNode | undefined;
};

const absoluteFillObject = {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

const imageDimensions = scaleDimensions(targetDimensions, 0.4);

const px = 3;
const py = 3;

const Container = styled(Box).attrs({
  position: "relative",
  px,
  py,
})``;

const AbsoluteBackgroundContainer = styled(Flex).attrs({
  ...absoluteFillObject,
  backgroundColor: "lightgreen",
})``;

const BackgroundPlaceholder = styled(Flex).attrs({
  ...absoluteFillObject,
  backgroundColor: "#494949",
  px,
  py,
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
})``;

const AbsoluteInnerImageContainer = styled(Flex).attrs({
  ...absoluteFillObject,
  mx: px,
  my: py,
  overflow: "hidden",
})``;

const FramedImage: React.FC<Props> = ({
  src,
  backgroundSrc,
  backgroundPlaceholderText,
  loadingProgress = 1,
  children,
  ...imageProps
}) => {
  const { space } = useTheme();
  return (
    <StyleProviderV3 selectedPalette="light">
      <Container>
        <AbsoluteBackgroundContainer>
          {backgroundSrc ? (
            <img
              src={backgroundSrc}
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
        <AbsoluteInnerImageContainer style={{ height: loadingProgress * imageDimensions.height }}>
          {src ? <img {...imageProps} src={src} style={imageDimensions} /> : null}
        </AbsoluteInnerImageContainer>
        <Flex style={imageDimensions}>{children}</Flex>
      </Container>
    </StyleProviderV3>
  );
};

export default FramedImage;

type SourceContext = {
  src?: string | undefined;
};

const initialState = {
  src: undefined,
};

export const ImageSourceContext = React.createContext<SourceContext>(initialState);

export const FramedImageWithContext: React.FC<Omit<Props, "src">> = props => {
  const { src } = useContext(ImageSourceContext);
  return <FramedImage {...props} src={src} />;
};
