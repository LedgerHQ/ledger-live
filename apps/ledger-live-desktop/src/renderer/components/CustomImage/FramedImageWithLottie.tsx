import React from "react";

import Animation from "~/renderer/animations";
import { AnimationObject } from "../DeviceAction/animations";
import FramedImage, { transferLottieConfig, Props as FramedImageProps } from "./FramedImage";

export type Props = {
  animation: AnimationObject;
  src?: FramedImageProps["src"];
  loadingProgress?: FramedImageProps["loadingProgress"];
};

const FramedImageWithLottie = ({ src, animation, loadingProgress }: Props) => {
  return (
    <FramedImage
      frameConfig={transferLottieConfig}
      src={src}
      loadingProgress={loadingProgress}
      background={
        <Animation animation={animation} width={transferLottieConfig.frameWidth} autoplay loop />
      }
    />
  );
};

export default FramedImageWithLottie;
