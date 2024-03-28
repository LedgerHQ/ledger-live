import AnimatedLottieView from "lottie-react-native";
import React, { useContext, useMemo } from "react";
import FramedPicture, { Props as FramedImageProps, ImageSourceContext } from "./FramedPicture";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { getFramedPictureConfig } from "./framedPictureConfigs";

export type Props = {
  lottieSource: React.ComponentProps<typeof AnimatedLottieView>["source"];
  source?: FramedImageProps["source"];
  loadingProgress?: FramedImageProps["loadingProgress"];
  children?: React.ReactNode;
  deviceModelId: CLSSupportedDeviceModelId;
};

const FramedLottie: React.FC<Props> = ({
  source,
  lottieSource,
  loadingProgress,
  deviceModelId,
}) => {
  const framedPictureConfig = getFramedPictureConfig("transfer", deviceModelId);
  const lottiesStyle = useMemo(
    () => ({
      width: framedPictureConfig.frameWidth,
      height: framedPictureConfig.frameHeight,
    }),
    [framedPictureConfig],
  );
  return (
    <FramedPicture
      framedPictureConfig={getFramedPictureConfig("transfer", deviceModelId)}
      source={source}
      loadingProgress={loadingProgress}
      background={<AnimatedLottieView autoPlay loop style={lottiesStyle} source={lottieSource} />}
    />
  );
};

export default FramedLottie;

export const FramedLottieWithContext: React.FC<Omit<Props, "source">> = props => {
  const { source } = useContext(ImageSourceContext);
  return <FramedLottie {...props} source={source} />;
};
