import AnimatedLottieView from "lottie-react-native";
import React, { useContext } from "react";
import StaxFramedImage, {
  transferConfig,
  Props as FramedImageProps,
  ImageSourceContext,
} from "./StaxFramedImage";

const lottiesStyle = {
  width: transferConfig.frameWidth,
  height: transferConfig.frameHeight,
};

export type Props = {
  lottieSource: React.ComponentProps<typeof AnimatedLottieView>["source"];
  source?: FramedImageProps["source"];
  loadingProgress?: FramedImageProps["loadingProgress"];
  children?: React.ReactNode;
};

const StaxFramedLottie: React.FC<Props> = ({ source, lottieSource, loadingProgress }) => {
  return (
    <StaxFramedImage
      frameConfig={transferConfig}
      source={source}
      loadingProgress={loadingProgress}
      background={<AnimatedLottieView autoPlay loop style={lottiesStyle} source={lottieSource} />}
    />
  );
};

export default StaxFramedLottie;

export const StaxFramedLottieWithContext: React.FC<Omit<Props, "source">> = props => {
  const { source } = useContext(ImageSourceContext);
  return <StaxFramedLottie {...props} source={source} />;
};
