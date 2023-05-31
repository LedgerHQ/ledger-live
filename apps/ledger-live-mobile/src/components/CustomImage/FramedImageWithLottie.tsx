import AnimatedLottieView from "lottie-react-native";
import React, { useContext } from "react";
import FramedImage, {
  transferConfig,
  Props as FramedImageProps,
  ImageSourceContext,
} from "./FramedImage";

const lottiesStyle = {
  width: transferConfig.frameWidth,
  height: transferConfig.frameHeight,
};

export type Props = {
  lottieSource: React.ComponentProps<typeof AnimatedLottieView>["source"];
  source?: FramedImageProps["source"];
  loadingProgress?: FramedImageProps["loadingProgress"];
};

const FramedImageWithLottie: React.FC<Props> = ({
  source,
  lottieSource,
  loadingProgress,
}) => {
  return (
    <FramedImage
      frameConfig={transferConfig}
      source={source}
      loadingProgress={loadingProgress}
      background={
        <AnimatedLottieView
          autoPlay
          loop
          style={lottiesStyle}
          source={lottieSource}
        />
      }
    />
  );
};

export default FramedImageWithLottie;

export const FramedImageWithLottieWithContext: React.FC<
  Omit<Props, "source">
> = props => {
  const { source } = useContext(ImageSourceContext);
  return <FramedImageWithLottie {...props} source={source} />;
};
