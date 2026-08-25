import React from "react";
import Lottie, { LottieProps } from "react-lottie";
import { getEnv } from "@shared/env";

export type AnimationProps = Readonly<{
  animation: unknown;
  width?: string;
  height?: string;
  loop?: boolean;
  autoplay?: boolean;
  rendererSettings?: LottieProps["options"]["rendererSettings"];
}>;

export function Animation({
  animation,
  loop = true,
  autoplay = true,
  width = "100%",
  height = "auto",
  rendererSettings = { preserveAspectRatio: "xMidYMin" },
}: AnimationProps): React.JSX.Element | null {
  const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");

  if (!animation) return null;

  return (
    <div className="flex" style={{ maxHeight: "200px", maxWidth: "500px" }}>
      <Lottie
        style={{ width, height }}
        isClickToPauseDisabled
        ariaRole="animation"
        options={{
          loop,
          autoplay: !isPlaywright && autoplay,
          animationData: animation,
          rendererSettings,
        }}
      />
    </div>
  );
}
