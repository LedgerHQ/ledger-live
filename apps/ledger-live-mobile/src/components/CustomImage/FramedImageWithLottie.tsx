import AnimatedLottieView from "lottie-react-native";
import React, { useContext } from "react";
import FramedImage, {
  transferLottieConfig,
  Props as FramedImageProps,
  ImageSourceContext,
} from "./FramedImage";

/**
 * squareRoot(width of the lottie bounding box / width of the device frame in the lottie)
 * */
const lottieScale = Math.sqrt(1182 / 502);

const lottiesStyle = {
  width: transferLottieConfig.frameWidth,
  transform: [{ scale: lottieScale }],
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
      frameConfig={transferLottieConfig}
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
